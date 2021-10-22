import { getSubtitlesCardBases, SubtitlesCardBase } from './cardPreview'
import { getCurrentNoteType } from './currentMedia'
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
