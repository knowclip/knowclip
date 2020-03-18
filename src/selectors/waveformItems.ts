import { createSelector } from 'reselect'
import {
  getSubtitlesCardBases,
  WaveformSelectionExpanded,
  SubtitlesCardBase,
} from './cardPreview'
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
        return clipsById[selection.id]
          ? {
              ...selection,
              item: clipsById[selection.id],
            }
          : null
      case 'Preview':
        return cardsBases.cards[selection.cardBaseIndex]
          ? {
              ...selection,
              item: cardsBases.cards[selection.cardBaseIndex],
            }
          : null
    }
  }
)

export const getNewWaveformSelectionAt = (
  state: AppState,
  newX: number
): WaveformSelectionExpanded | null => {
  const selection = getWaveformSelection(state)
  const waveformItems = getWaveformItems(state)

  return getNewWaveformSelectionAtFromSubset(selection, waveformItems, newX)
}
export const getNewWaveformSelectionAtFromSubset = (
  selection: WaveformSelectionExpanded | null,
  waveformItems: WaveformSelectionExpanded[],
  newX: number
): WaveformSelectionExpanded | null => {
  const updatedSelection =
    selection &&
    getUpdatedSameSelection(selection, waveformItems[selection.index] || null)
  if (
    updatedSelection &&
    newX >= updatedSelection.item.start &&
    newX <= updatedSelection.item.end
  )
    return updatedSelection

  const overlapping: WaveformSelectionExpanded[] = []

  for (const clipOrPreview of waveformItems) {
    const { item } = clipOrPreview
    if (item.start > newX) break

    if (newX >= item.start && newX <= item.end) overlapping.push(clipOrPreview)
  }

  if (overlapping.length <= 1) return overlapping[0] || null

  return overlapping.find(({ type }) => type === 'Clip') || null
}

const getUpdatedSameSelection = (
  prev: WaveformSelectionExpanded,
  next: WaveformSelectionExpanded | null
): WaveformSelectionExpanded | null => {
  if (!next || prev.type !== next.type) return null
  if (prev.type === 'Clip' && prev.item.id === (next.item as Clip).id)
    return next
  if (
    prev.type === 'Preview' &&
    prev.item.index === (next.item as SubtitlesCardBase).index
  )
    return next

  return null
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
