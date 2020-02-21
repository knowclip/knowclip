import { createSelector } from 'reselect'
import {
  getSubtitlesFlashcardFieldLinks,
  overlapsSignificantly,
} from './subtitles'
import { getClip } from './clips'
import { getClipIdAt } from './currentMedia'

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
  | { type: 'Clip'; id: ClipId; item: Clip }
  | { type: 'Preview'; index: number; item: SubtitlesCardBase }
  | null => {
  const { waveformSelection } = state.session
  if (waveformSelection && waveformSelection.type === 'Clip') {
    const clip = getClip(state, waveformSelection.id)
    return clip && { type: 'Clip', id: clip.id, item: clip }
  }

  if (waveformSelection && waveformSelection.type === 'Preview') {
    const preview: SubtitlesCardBase = getSubtitlesCardBases(state).cards[
      waveformSelection.index
    ]
    return preview
      ? { type: 'Preview', index: waveformSelection.index, item: preview }
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

export const getSubtitlesCardBases = createSelector(
  (state: AppState) => state.waveform,
  (state: AppState) => state.subtitles,
  getSubtitlesFlashcardFieldLinks,
  getSubtitlesCardBaseFieldPriority,
  (
    waveform,
    subtitles,
    fieldsToTracks,
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
        getFieldsPreviewFromCardsBase: () => ({}),
      }

    const includedTracks = fieldsCuePriority.map(
      fieldName => fieldsToTracks[fieldName]
    )

    const halfSecond = (waveform.stepsPerSecond * waveform.stepLength) / 2

    const lastIndexes = fieldsCuePriority.map(() => 0)
    const cards: SubtitlesCardBase[] = cueTrack.chunks.map(cueChunk => {
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
    })

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

export const getNewWaveformSelectionAt = (state: AppState, x: number) => {
  const clipId = getClipIdAt(state, x)
  const clip = clipId && state.clips.byId[clipId]

  if (clipId && clip) return { type: 'Clip' as const, id: clipId, item: clip }

  const subtitles = getSubtitlesCardBases(state)

  for (let i = 0; i < subtitles.cards.length; i++) {
    const card = subtitles.cards[i]
    if (card.start > x) return null

    if (x >= card.start && x <= card.end)
      return { type: 'Preview' as const, index: i, item: card }
  }

  return null
}
