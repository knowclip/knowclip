import { createSelector } from 'reselect'
import { getCurrentMediaFile, getCurrentNoteType } from './currentMedia'
import {
  getSubtitlesFlashcardFieldLinks,
  getSubtitlesChunksWithinRange,
  getSubtitlesChunksWithinRangeFromTracksState,
  overlapsSignificantly,
} from './subtitles'
import { getDefaultTags, getHighlightedClip } from './session'
import { getWaveform } from './waveform'
import { TransliterationFlashcardFields } from '../types/Project'
import {
  blankSimpleFields,
  blankTransliterationFields,
} from '../utils/newFlashcard'
import { getClip } from './clips'
const getCurrentCardPreviewIndex = (state: AppState) => {
  const highlightedClip = getHighlightedClip(state)

  if (highlightedClip) return null

  const subtitlesBases = getSubtitlesCardBases(state)
  if (!subtitlesBases.linkedTrackIds.length) return -1
}

export type SubtitlesCardBase = {
  // start and end from cues base?
  fields: Dict<SubtitlesTrackId, SubtitlesChunkIndex[]>
  start: number
  end: number
}

const CUES_BASE_PRIORITY: TransliterationFlashcardFieldName[] = [
  'transcription',
  'pronunciation',
  'meaning',
  'notes',
]

export const getWaveformSelection = (
  state: AppState
):
  | { type: 'Clip'; clip: Clip }
  | { type: 'Preview'; index: number; preview: SubtitlesCardBase }
  | null => {
  const { waveformSelection } = state.session
  if (waveformSelection && waveformSelection.type === 'Clip') {
    const clip = getClip(state, waveformSelection.id)
    return clip && { type: 'Clip', clip }
  }

  if (waveformSelection && waveformSelection.type === 'Preview') {
    const preview: SubtitlesCardBase = getSubtitlesCardBases(state).cards[
      waveformSelection.index
    ]
    return preview
      ? { type: 'Preview', index: waveformSelection.index, preview }
      : null
  }

  return null
}

const getSubtitlesCardBaseFieldPriority = createSelector(
  getSubtitlesFlashcardFieldLinks,
  links => {
    return CUES_BASE_PRIORITY.filter(fieldName => Boolean(links[fieldName]))
  }
)

export type SubtitlesCardBases = {
  totalTracksCount: number
  cards: SubtitlesCardBase[]
  fieldNames: TransliterationFlashcardFieldName[]
  linkedTrackIds: SubtitlesTrackId[]
  excludedTracks: SubtitlesTrack[]
  getFieldsPreviewFromCardsBase: (
    cardBase: SubtitlesCardBase
  ) => Dict<SubtitlesTrackId, string>
}

// export const getFieldsPreviewFromCardBase = (cardBase: SubtitlesCardBase) => Dict<string, string> => {
//   const preview: Dict<string, string> = {}

// }

export const getSubtitlesCardBases = createSelector(
  getHighlightedClip,
  (state: AppState) => state.waveform,
  (state: AppState) => state.subtitles,
  getSubtitlesFlashcardFieldLinks,
  getDefaultTags,
  getCurrentNoteType,
  getSubtitlesCardBaseFieldPriority,
  (
    highlightedClip,
    waveform,
    subtitles,
    fieldsToTracks,
    defaultTags,
    noteType,
    fieldsCuePriority
  ): SubtitlesCardBases => {
    const [cueField] = fieldsCuePriority
    const cueTrackId = cueField && fieldsToTracks[cueField]
    const cueTrack = cueTrackId && subtitles[cueTrackId]
    if (!cueTrack)
      return {
        totalTracksCount: Object.values(subtitles).length,
        cards: [],
        fieldNames: [],
        linkedTrackIds: [],
        excludedTracks: Object.values(subtitles),
        getFieldsPreviewFromCardsBase: cardsBase => ({}),
      }

    const includedTracks = fieldsCuePriority.map(
      fieldName => fieldsToTracks[fieldName]
    )

    const halfSecond = (waveform.stepsPerSecond * waveform.stepLength) / 2

    const lastIndexes = fieldsCuePriority.map(fieldName => 0)
    const cards: SubtitlesCardBase[] = cueTrack.chunks.map(
      (cueChunk, cueChunkIndex) => {
        return {
          start: cueChunk.start,
          end: cueChunk.end,
          fields: fieldsCuePriority.reduce(
            (dict, fn, fieldPriority) => {
              const overlappedIndexes: number[] = []

              const trackId = fieldsToTracks[fn]
              const track = trackId && subtitles[trackId]
              const chunks = track ? track.chunks : []

              for (let i = lastIndexes[fieldPriority]; i < chunks.length; i++) {
                const chunk = chunks[i]
                lastIndexes[fieldPriority] = i

                if (!chunk) {
                  console.log({ track, i })
                  console.error(track)
                  throw new Error('invalid chunk index')
                }

                if (chunk.start >= cueChunk.end) {
                  break
                }
                if (
                  overlapsSignificantly(
                    cueChunk,
                    chunk.start,
                    chunk.end,
                    halfSecond
                  )
                ) {
                  overlappedIndexes.push(i)
                }
              }

              if (trackId) dict[trackId] = overlappedIndexes
              return dict
            },
            {} as Dict<SubtitlesTrackId, SubtitlesChunkIndex[]>
          ),
        }
      }
    )

    return {
      totalTracksCount: Object.values(subtitles).length,
      cards,
      fieldNames: fieldsCuePriority,
      linkedTrackIds: fieldsCuePriority
        .map(f => fieldsToTracks[f])
        .filter((id): id is string => Boolean(id)),
      excludedTracks: Object.values(subtitles).filter(
        track => !includedTracks.includes(track.id)
      ),
      getFieldsPreviewFromCardsBase: (cardsBase: SubtitlesCardBase) => {
        const preview: Dict<string, string> = {}
        for (const trackId in cardsBase.fields) {
          preview[trackId] = (cardsBase.fields[trackId] || [])
            .map(index => subtitles[trackId].chunks[index].text)
            .join('\n')
        }
        return preview
      },
    }
  }
)
