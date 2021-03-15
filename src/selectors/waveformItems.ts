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

export const getWaveformItems = createSelector(
  getCurrentFileClips,
  getSubtitlesCardBases,
  (clips, subtitles): Array<WaveformSelectionExpanded> => {
    const result: Array<WaveformSelectionExpanded> = []

    let clipIndex = 0
    let chunkIndex = 0

    const { cards: chunks } = subtitles

    while (clipIndex < clips.length && chunkIndex < chunks.length) {
      const clip = clips[clipIndex]
      while (
        chunkIndex < chunks.length &&
        overlapsSignificantly(chunks[chunkIndex], clip.start, clip.end)
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
  currentSelection: WaveformSelection | null,
  newWaveformItems: WaveformSelectionExpanded[],
  newMs: number
): WaveformSelectionExpanded | null => {
  const itemAtCurrentSelectionPosition = currentSelection
    ? newWaveformItems[currentSelection.index]
    : null
  const itemIsSameAsOldSelection =
    currentSelection &&
    itemAtCurrentSelectionPosition &&
    isItemSameAsOldSelection(currentSelection, itemAtCurrentSelectionPosition)
  if (
    itemIsSameAsOldSelection &&
    itemAtCurrentSelectionPosition &&
    newMs >= itemAtCurrentSelectionPosition.item.start &&
    newMs <= itemAtCurrentSelectionPosition.item.end
  )
    return itemAtCurrentSelectionPosition

  const overlapping: WaveformSelectionExpanded[] = []

  for (const clipOrPreview of newWaveformItems) {
    const { item } = clipOrPreview
    if (item.start > newMs) break

    if (newMs >= item.start && newMs <= item.end)
      overlapping.push(clipOrPreview)
  }

  if (overlapping.length <= 1) return overlapping[0] || null

  return overlapping.find(({ type }) => type === 'Clip') || null
}

const isItemSameAsOldSelection = (
  oldCurrentSelection: WaveformSelection,
  itemAtCurrentSelectionPosition: WaveformSelection
) => {
  if (oldCurrentSelection.type !== itemAtCurrentSelectionPosition.type)
    return false
  if (
    oldCurrentSelection.type === 'Clip' &&
    oldCurrentSelection.id ===
      (itemAtCurrentSelectionPosition as typeof oldCurrentSelection).id
  )
    return true
  if (
    oldCurrentSelection.type === 'Preview' &&
    oldCurrentSelection.index ===
      (itemAtCurrentSelectionPosition as typeof oldCurrentSelection).index
  )
    return true

  return false
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
    if (overlapsSignificantly(cardBase, start, end)) {
      const tracksToFieldsText = cardBase
        ? subs.getFieldsPreviewFromCardsBase(cardBase)
        : null
      for (const fieldName of subs.fieldNames) {
        const trackId = fieldsToTracks[fieldName]
        const newText =
          (trackId && tracksToFieldsText && tracksToFieldsText[trackId]) || ''

        const text = fields[fieldName]

        fields[fieldName] = [text.trim(), newText.trim()]
          .filter((s) => s)
          .join('\n')
      }
    } else if (cardBase.start >= end) break
  }

  return fields
}
