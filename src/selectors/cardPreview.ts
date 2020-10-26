import { createSelector } from 'reselect'
import {
  getSubtitlesFlashcardFieldLinks,
  overlapsSignificantly,
} from './subtitles'
import { getCurrentMediaFile } from './currentMedia'
import { limitSelectorToDisplayedItems } from './limitSelectorToDisplayedItems'

export type SubtitlesCardBase = {
  fields: Dict<SubtitlesTrackId, SubtitlesChunkIndex[]>
  index: number
  start: number
  end: number
}
type SubtitlesChunkIndex = number

export const CUES_BASE_PRIORITY: TransliterationFlashcardFieldName[] = [
  'transcription',
  'pronunciation',
  'meaning',
  'notes',
]

export type WaveformSelectionExpanded =
  | { type: 'Clip'; index: number; item: Clip; id: string }
  | {
      type: 'Preview'
      index: number
      item: SubtitlesCardBase
      cardBaseIndex: number
    }

const getSubtitlesCardBaseFieldPriority = createSelector(
  getSubtitlesFlashcardFieldLinks,
  (state: AppState) => state.subtitles,
  (links, subtitles) => {
    return CUES_BASE_PRIORITY.filter((fieldName) => {
      const trackId = links[fieldName]
      return Boolean(trackId && subtitles[trackId])
    })
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

const getHalfSecond = ({ waveform }: AppState) =>
  (waveform.stepsPerSecond * waveform.stepLength) / 2

export const getSubtitlesCardBases = createSelector(
  getHalfSecond,
  (state: AppState) => state.subtitles,
  getCurrentMediaFile,
  getSubtitlesFlashcardFieldLinks,
  getSubtitlesCardBaseFieldPriority,
  (
    halfSecond,
    subtitles,
    currentFile,
    fieldsToTracks,
    fieldsCuePriority
  ): SubtitlesCardBases => {
    const [cueField] = fieldsCuePriority
    const cueTrackId = cueField && fieldsToTracks[cueField]
    const cueTrack = cueTrackId && subtitles[cueTrackId]
    const totalTracksCount = currentFile ? currentFile.subtitles.length : 0
    if (!cueTrack)
      return {
        totalTracksCount,
        cards: [],
        fieldNames: fieldsCuePriority,
        linkedTrackIds: [],
        excludedTracks: Object.values(subtitles),
        getFieldsPreviewFromCardsBase: () => ({}),
      }

    const includedTracks = fieldsCuePriority.map(
      (fieldName) => fieldsToTracks[fieldName]
    )

    const lastIndexes = fieldsCuePriority.map(() => 0)
    const cards: SubtitlesCardBase[] = cueTrack.chunks.map(
      (cueChunk, index) => {
        return {
          index,
          start: cueChunk.start,
          end: cueChunk.end,
          fields: fieldsCuePriority.reduce((dict, fn, fieldPriority) => {
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
          }, {} as Dict<SubtitlesTrackId, SubtitlesChunkIndex[]>),
        }
      }
    )

    return {
      totalTracksCount,
      cards,
      fieldNames: fieldsCuePriority,
      linkedTrackIds: fieldsCuePriority
        .map((f) => fieldsToTracks[f])
        .filter((id): id is string => Boolean(id)),
      excludedTracks: Object.values(subtitles).filter(
        (track) => !includedTracks.includes(track.id)
      ),
      getFieldsPreviewFromCardsBase: (cardsBase: SubtitlesCardBase) => {
        const preview: Dict<string, string> = {}
        for (const trackId in cardsBase.fields) {
          preview[trackId] = (cardsBase.fields[trackId] || [])
            .map((index) => subtitles[trackId].chunks[index].text)
            .join('\n')
        }
        return preview
      },
    }
  }
)

const limitSubtitlesCardsBasesCardsToDisplayed = limitSelectorToDisplayedItems(
  (cb: SubtitlesCardBase) => cb.start
)

export const getDisplayedSubtitlesCardBases = createSelector(
  getSubtitlesCardBases,
  (state: AppState) => state.waveform.viewBox.xMin,
  (bases, xMin) => {
    const subtitlesCardBases: SubtitlesCardBases = {
      ...bases,
      cards: limitSubtitlesCardsBasesCardsToDisplayed(bases.cards, xMin),
    }
    return subtitlesCardBases
  }
)
