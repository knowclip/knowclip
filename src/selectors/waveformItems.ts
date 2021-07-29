import { createSelector } from 'reselect'
import { getSubtitlesCardBases, SubtitlesCardBase } from './cardPreview'
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

export const getWaveformSelection = (state: AppState) =>
  state.session.waveformSelection
export const getSelectionItem = (
  state: AppState
): Clip | SubtitlesCardBase | null => {
  const id = getWaveformSelection(state)?.id
  if (!id) return null
  return (
    state.clips.byId[id] || getSubtitlesCardBases(state).cardsMap[id] || null
  )
}

// export const getNewWaveformSelectionAt = (
//   state: AppState,
//   newX: number
// ): WaveformSelection | null => {
//   const selection = getWaveformSelection(state)
//   const waveformItems = getWaveformItems(state)

//   return getNewWaveformSelectionAtFromSubset(selection, waveformItems, newX)
// }
// const getNewWaveformSelectionAtFromSubset = (
//   currentSelection: WaveformSelection | null,
//   newWaveformItems: WaveformSelection[],
//   newMs: number
// ): WaveformSelection | null => {
//   const itemAtCurrentSelectionPosition = currentSelection
//     ? newWaveformItems[currentSelection.index]
//     : null
//   const itemIsSameAsOldSelection =
//     currentSelection &&
//     itemAtCurrentSelectionPosition &&
//     isItemSameAsOldSelection(currentSelection, itemAtCurrentSelectionPosition)
//   if (
//     itemIsSameAsOldSelection &&
//     itemAtCurrentSelectionPosition &&
//     newMs >= itemAtCurrentSelectionPosition.item.start &&
//     newMs <= itemAtCurrentSelectionPosition.item.end
//   )
//     return itemAtCurrentSelectionPosition

//   const overlapping: WaveformSelection[] = []

//   for (const clipOrPreview of newWaveformItems) {
//     const { item } = clipOrPreview
//     if (item.start > newMs) break

//     if (newMs >= item.start && newMs <= item.end)
//       overlapping.push(clipOrPreview)
//   }

//   if (overlapping.length <= 1) return overlapping[0] || null

//   return overlapping.find(({ type }) => type === 'Clip') || null
// }

// const isItemSameAsOldSelection = (
//   oldCurrentSelection: WaveformSelection,
//   itemAtCurrentSelectionPosition: WaveformSelection
// ) => {
//   if (oldCurrentSelection.type !== itemAtCurrentSelectionPosition.type)
//     return false
//   if (
//     oldCurrentSelection.type === 'Clip' &&
//     oldCurrentSelection.id ===
//       (itemAtCurrentSelectionPosition as typeof oldCurrentSelection).id
//   )
//     return true
//   if (
//     oldCurrentSelection.type === 'Preview' &&
//     oldCurrentSelection.index ===
//       (itemAtCurrentSelectionPosition as typeof oldCurrentSelection).index
//   )
//     return true

//   return false
// }

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
