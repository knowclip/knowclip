// @flow
import stripHtml from '../utils/stripHtml'
import { getXAtMilliseconds } from './waveformTime'

export const getSubtitlesTracks = (state: AppState): Array<SubtitlesTrack> =>
  state.subtitles.loadedTracks

export const getSubtitlesTrack = (
  state: AppState,
  id: SubtitlesTrackId
): ?SubtitlesTrack =>
  state.subtitles.loadedTracks.find(track => track.id === id)

export const getEmbeddedSubtitlesTracks = (
  state: AppState
): Array<EmbeddedSubtitlesTrack> => {
  const result = []
  state.subtitles.loadedTracks.forEach(track => {
    if (track.type === 'EmbeddedSubtitlesTrack') result.push(track)
  })
  return result
}

export const getExternalSubtitlesTracks = (
  state: AppState
): Array<ExternalSubtitlesTrack> => {
  const result = []
  state.subtitles.loadedTracks.forEach(track => {
    if (track.type === 'ExternalSubtitlesTrack') result.push(track)
  })
  return result
}

export const readVttChunk = (
  state: AppState,
  { start, end, text }: { start: number, end: number, text: string }
): SubtitlesChunk => ({
  start: getXAtMilliseconds(state, start),
  end: getXAtMilliseconds(state, end),
  text: stripHtml(text).trim(),
})

export const readSubsrtChunk = readVttChunk

const chunkLength = (chunk: SubtitlesChunk): WaveformX =>
  chunk.end - chunk.start

// const overlap = (
//   chunk: SubtitlesChunk,
//   start: WaveformX,
//   end: WaveformX
// ): boolean =>
//   (start >= chunk.start && chunk.end - start >= chunkLength(chunk) * 0.5) ||
//   (end <= chunk.end && end - chunk.start >= chunkLength(chunk) * 0.5) ||
//   (chunk.start >= start && chunk.end <= end)

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
  if (!track)
    throw new Error(`Could not find subtitles track ${subtitlesTrackId}`)
  return track.chunks.filter(chunk =>
    overlap(
      chunk,
      start,
      end,
      (state.waveform.stepsPerSecond * state.waveform.stepLength) / 2
    )
  )
}

export const getSubtitlesFashcardFieldLinks = (
  state: AppState
): { [FlashcardFieldName]: SubtitlesTrackId } =>
  state.subtitles.flashcardFieldLinks
