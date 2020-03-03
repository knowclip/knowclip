import { createSelector } from 'reselect'
import { getSubtitlesCardBases, WaveformSelectionExpanded } from './cardPreview'
import { getCurrentFileClips, getCurrentNoteType } from './currentMedia'
import {
  overlapsSignificantly,
  getSubtitlesFlashcardFieldLinks,
} from './subtitles'
import { TransliterationFlashcardFields } from '../types/Project'
import {
  blankSimpleFields,
  blankTransliterationFields,
} from '../utils/newFlashcard'

export const getHalfSecond = ({ waveform }: AppState) =>
  (waveform.stepsPerSecond * waveform.stepLength) / 2

export const getWaveformItems = createSelector(
  getCurrentFileClips,
  getHalfSecond,
  getSubtitlesCardBases,
  (clips, halfSecond, subtitles): Array<WaveformSelectionExpanded> => {
    const result: Array<WaveformSelectionExpanded> = []

    let clipIndex = 0
    let chunkIndex = 0

    const { cards: chunks } = subtitles

    while (clipIndex < clips.length && chunkIndex < chunks.length) {
      const clip = clips[clipIndex]
      while (
        chunkIndex < chunks.length &&
        overlapsSignificantly(
          chunks[chunkIndex],
          clip.start,
          clip.end,
          halfSecond
        )
      ) {
        chunkIndex++
      }
      const chunk = chunks[chunkIndex]

      if (!chunk || clip.start <= chunk.start) {
        result.push({
          type: 'Clip',
          id: clip.id,
          index: result.length,
          item: clip,
        })
        clipIndex += 1
      } else {
        result.push({
          type: 'Preview',
          index: result.length,
          item: chunk,
          cardBaseIndex: chunk.index,
        })
        chunkIndex += 1
      }
    }
    for (let i = clipIndex; i < clips.length; i++) {
      result.push({
        type: 'Clip',
        id: clips[i].id,
        index: result.length,
        item: clips[i],
      })
    }
    for (let i = chunkIndex; i < chunks.length; i++) {
      result.push({
        type: 'Preview',
        index: result.length,
        item: chunks[i],
        cardBaseIndex: chunks[i].index,
      })
    }

    return result
  }
)

export const getWaveformSelection = createSelector(
  (state: AppState) => state.session.waveformSelection,
  getSubtitlesCardBases,
  (state: AppState) => state.clips.byId,
  getWaveformItems,
  (selection, cardsBases, clipsById): WaveformSelectionExpanded | null => {
    if (!selection) return null

    switch (selection.type) {
      case 'Clip':
        return {
          ...selection,
          item: clipsById[selection.id],
        }
      case 'Preview':
        return {
          ...selection,
          item: cardsBases.cards[selection.cardBaseIndex],
        }
    }
  }
)

export const getNewWaveformSelectionAt = (
  state: AppState,
  newX: number
): WaveformSelectionExpanded | null => {
  const selection = getWaveformSelection(state)
  if (selection && newX >= selection.item.start && newX <= selection.item.end)
    return selection

  const overlapping: WaveformSelectionExpanded[] = []

  for (const clipOrPreview of getWaveformItems(state)) {
    const { item } = clipOrPreview
    if (item.start > newX) break

    if (newX >= item.start && newX <= item.end) overlapping.push(clipOrPreview)
  }

  if (overlapping.length <= 1) return overlapping[0] || null

  return overlapping.find(({ type }) => type === 'Clip') || null
}

export const getBlankFields = (state: AppState) =>
  getCurrentNoteType(state) === 'Simple'
    ? blankSimpleFields
    : blankTransliterationFields

export const getNewFieldsFromLinkedSubtitles = (
  state: AppState,
  { start, end }: { start: number; end: number }
): FlashcardFields => {
  const subs = getSubtitlesCardBases(state)
  const fieldsToTracks = getSubtitlesFlashcardFieldLinks(state)
  const fields = { ...getBlankFields(state) } as TransliterationFlashcardFields

  for (const cardBase of subs.cards) {
    if (overlapsSignificantly(cardBase, start, end, getHalfSecond(state))) {
      const tracksToFieldsText = cardBase
        ? subs.getFieldsPreviewFromCardsBase(cardBase)
        : null
      for (const fieldName of subs.fieldNames) {
        const trackId = fieldsToTracks[fieldName]
        const newText =
          (trackId && tracksToFieldsText && tracksToFieldsText[trackId]) || ''

        const text = fields[fieldName]

        fields[fieldName] = [text.trim(), newText.trim()]
          .filter(s => s)
          .join('\n')
      }
    } else if (cardBase.start >= end) break
  }

  return fields
}
