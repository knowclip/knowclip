import { createSelector } from 'reselect'
import { getCurrentMediaFile, getCurrentNoteType } from './currentMedia'
import {
  getSubtitlesFlashcardFieldLinks,
  getSubtitlesChunksWithinRange,
  getSubtitlesChunksWithinRangeFromTracksState,
} from './subtitles'
import { getDefaultTags, getHighlightedClip } from './session'
import { getWaveform } from './waveform'
import { TransliterationFlashcardFields } from '../types/Project'
import {
  blankSimpleFields,
  blankTransliterationFields,
} from '../utils/newFlashcard'

export type CardPreview = {
  fields: FlashcardFields
  tags: string[]
}

export const getCardPreview = createSelector(
  getHighlightedClip,
  (state: AppState) => state.waveform,
  (state: AppState) => state.subtitles,
  getSubtitlesFlashcardFieldLinks,
  getDefaultTags,
  getCurrentNoteType,
  (
    highlightedClip,
    waveform,
    subtitles,
    fieldsToTracks,
    defaultTags,
    noteType
  ): CardPreview | null => {
    if (highlightedClip) return null

    const currentPosition = waveform.cursor.x
    console.log({ noteType })
    if (!noteType) return null
    const fields = {
      ...(noteType === 'Simple'
        ? blankSimpleFields
        : blankTransliterationFields),
    } as TransliterationFlashcardFields

    let none = true
    for (const fn in fieldsToTracks) {
      const fieldName = fn as TransliterationFlashcardFieldName
      const trackId = fieldsToTracks[fieldName]
      if (trackId) {
        const chunks = getSubtitlesChunksWithinRangeFromTracksState(
          subtitles,
          waveform,
          trackId,
          currentPosition,
          currentPosition
        )
        const text = chunks[0] && chunks[0].text
        if (text) {
          none = false

          fields[fieldName] = text
        }
      }
    }

    if (none) return null

    return {
      fields,
      tags: defaultTags,
    }
  }
)
