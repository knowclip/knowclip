import stripHtml from '../utils/stripHtml'
import { getXAtMilliseconds } from './waveformTime'
import {
  blankSimpleFields,
  blankTransliterationFields,
} from '../utils/newFlashcard'
import { getCurrentMediaFile } from './project'
import { getFileAvailability } from './files'
import { createSelector } from 'reselect'

export const getSubtitlesFile = (
  state: AppState,
  id: string
): VttConvertedSubtitlesFile | ExternalSubtitlesFile | null =>
  state.files.VttConvertedSubtitlesFile[id] ||
  state.files.ExternalSubtitlesFile[id] ||
  null

export const getSubtitlesLoadedFile = (state: AppState, id: string) => {
  const record = getSubtitlesFile(state, id)

  return record ? getFileAvailability(state, record) : null
}

const getSubtitles = (state: AppState) => state.subtitles

export const getSubtitlesTracks = createSelector(
  getCurrentMediaFile,
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
  const media = getCurrentMediaFile(state)
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
