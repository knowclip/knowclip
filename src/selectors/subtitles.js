// @flow
import stripHtml from '../utils/stripHtml'
import { getXAtMilliseconds } from './waveformTime'

export const getSubtitles = (state: AppState): Array<SubtitlesTrack> =>
  state.subtitles.loadedTracks

export const getEmbeddedSubtitlesTracks = (
  state: AppState
): Array<EmbeddedSubtitlesTrack> => {
  const result = []
  state.subtitles.loadedTracks.forEach(track => {
    if (track.type === 'EmbeddedSubtitlesTrack') result.push(track)
  })
  return result
}

export const readVttChunk = (
  state: AppState,
  { start, end, text }: { start: number, end: number, text: string }
): SubtitlesChunk => ({
  start: getXAtMilliseconds(state, start),
  end: getXAtMilliseconds(state, end),
  text: stripHtml(text),
})

export const readSubsrtChunk = readVttChunk
