import stripHtml from '../utils/stripHtml'
import { getXAtMilliseconds } from './waveformTime'
import {
  blankSimpleFields,
  blankTransliterationFields,
} from '../utils/newFlashcard'
import { getCurrentMediaFileRecord } from './project'
import { getPreviouslyLoadedFile } from './files'
import { createSelector } from 'reselect'

export const getSubtitlesFileRecord = (
  state: AppState,
  id: string
): TemporaryVttFileRecord | ExternalSubtitlesFileRecord | null =>
  state.fileRecords.TemporaryVttFile[id] ||
  state.fileRecords.ExternalSubtitlesFile[id] ||
  null

export const getSubtitlesLoadedFile = (state: AppState, id: string) => {
  const record = getSubtitlesFileRecord(state, id)

  return record ? getPreviouslyLoadedFile(state, record) : null
}

// export const trackWasLoaded = (state: AppState, id: string) => {
//   const loadedFile = getSubtitlesLoadedFile(state, id)
//   if (!loadedFile || !loadedFile.status === 'CURRENTLY_LOADED') return false
//   const record = getSubtitlesFileRecord(state, id)

//   // const
//   return loadedFile ? loadedFile.status === 'CURRENTLY_LOADED' : false
// }

const getSubtitles = (state: AppState) => state.subtitles

export const getSubtitlesTracks = createSelector(
  getCurrentMediaFileRecord,
  getSubtitles,
  (currentFile, subtitles): Array<SubtitlesTrack> => {
    if (!currentFile) return []
    return currentFile.subtitles
      .map(id => subtitles[id])
      .filter((track): track is SubtitlesTrack => Boolean(track))
  }
)

export const getSubtitlesTrack = (
  state: AppState,
  id: SubtitlesTrackId
): SubtitlesTrack | null => state.subtitles[id] || null

const isEmbedded = (track: SubtitlesTrack): track is EmbeddedSubtitlesTrack =>
  track.type === 'EmbeddedSubtitlesTrack'
const isExternal = (track: SubtitlesTrack): track is ExternalSubtitlesTrack =>
  track.type === 'ExternalSubtitlesTrack'
export const getEmbeddedSubtitlesTracks = (
  state: AppState
): Array<EmbeddedSubtitlesTrack> => getSubtitlesTracks(state).filter(isEmbedded)

export const getExternalSubtitlesTracks = (
  state: AppState
): Array<ExternalSubtitlesTrack> => getSubtitlesTracks(state).filter(isExternal)

export const readVttChunk = (
  state: AppState,
  {
    start,
    end,
    text,
  }: {
    start: number
    end: number
    text: string
  }
): SubtitlesChunk => ({
  start: getXAtMilliseconds(state, start),
  end: getXAtMilliseconds(state, end),
  text: (stripHtml(text) || '').trim(),
})

export const readSubsrtChunk = readVttChunk

const overlap = (
  chunk: SubtitlesChunk,
  start: WaveformX,
  end: WaveformX,
  halfSecond: WaveformX
): boolean =>
  (start >= chunk.start && chunk.end - start >= halfSecond) ||
  (end <= chunk.end && end - chunk.start >= halfSecond) ||
  (chunk.start >= start && chunk.end <= end)

export const getSubtitlesChunksWithinRange = (
  state: AppState,
  subtitlesTrackId: SubtitlesTrackId,
  start: WaveformX,
  end: WaveformX
): Array<SubtitlesChunk> => {
  const track = getSubtitlesTrack(state, subtitlesTrackId)
  if (!track) return []

  return track.chunks.filter(chunk =>
    overlap(
      chunk,
      start,
      end,
      (state.waveform.stepsPerSecond * state.waveform.stepLength) / 2
    )
  )
}

export const getSubtitlesFlashcardFieldLinks = (
  state: AppState // should probably be ?id
): SubtitlesFlashcardFieldsLinks => {
  const media = getCurrentMediaFileRecord(state)
  return media ? media.flashcardFieldsToSubtitlesTracks : {}
}

export const getNewFieldsFromLinkedSubtitles = (
  state: AppState,
  noteType: NoteType,
  { start, end }: PendingClip
): FlashcardFields => {
  const links = getSubtitlesFlashcardFieldLinks(state)
  const result =
    noteType === 'Simple'
      ? { ...blankSimpleFields }
      : { ...blankTransliterationFields }
  for (const fieldName in links) {
    const coerced = fieldName as FlashcardFieldName
    const trackId = links[coerced]
    const chunks = trackId
      ? getSubtitlesChunksWithinRange(state, trackId, start, end)
      : []
    // @ts-ignore
    result[fieldName] = chunks.map(chunk => chunk.text).join('\n')
  }
  return result
}
