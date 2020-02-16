import { createSelector } from 'reselect'
import { getCurrentMediaFile } from './currentMedia'
import {
  getSubtitlesFlashcardFieldLinks,
  getSubtitlesChunksWithinRange,
  getSubtitlesChunksWithinRangeFromTracksState,
} from './subtitles'
import { getDefaultTags, getHighlightedClip } from './session'
import { getWaveform } from './waveform'
import { TransliterationFlashcardFields } from '../types/Project'

type CardPreview = {
  fields: FlashcardFields
  tags: string[]
}

export const getCardPreview = createSelector(
  getHighlightedClip,
  (state: AppState) => state.waveform,
  (state: AppState) => state.subtitles,
  getSubtitlesFlashcardFieldLinks,
  getDefaultTags,
  (
    highlightedClip,
    waveform,
    subtitles,
    fieldsToTracks,
    defaultTags
  ): CardPreview | null => {
    if (highlightedClip) return null

    const currentPosition = waveform.cursor.x
    const fields = {} as TransliterationFlashcardFields

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
