import { createSelector } from 'reselect'
import {
  getSubtitlesCardBases,
  SubtitlesCardBase,
  SubtitlesCardBases,
} from './cardPreview'
import { getCurrentFileClips } from './currentMedia'
import { overlapsSignificantly } from './subtitles'

export const getHalfSecond = ({ waveform }: AppState) =>
  (waveform.stepsPerSecond * waveform.stepLength) / 2

export const getWaveformItems = createSelector(
  getCurrentFileClips,
  getHalfSecond,
  getSubtitlesCardBases as (state: AppState) => SubtitlesCardBases,
  (clips, halfSecond, subtitles): Array<Clip | SubtitlesCardBase> => {
    const result: Array<Clip | SubtitlesCardBase> = []

    let clipIndex = 0
    let chunkIndex = 0

    const { cards: chunks } = subtitles

    while (clipIndex < clips.length && chunkIndex < chunks.length) {
      const clip = clips[clipIndex]
      const chunk = chunks[chunkIndex]

      if (clip.start <= chunk.start) {
        result.push(clip)
        clipIndex += 1

        for (
          let i = chunkIndex;
          i < chunks.length &&
          overlapsSignificantly(chunks[i], clip.start, clip.end, halfSecond);
          i++
        ) {
          chunkIndex += 1
        }
      } else {
        if (!overlapsSignificantly(chunk, clip.start, clip.end, halfSecond))
          result.push(chunk)
        chunkIndex += 1
      }
    }
    for (let i = clipIndex; i < clips.length; i++) {
      result.push(clips[i])
    }
    for (let i = chunkIndex; i < chunks.length; i++) {
      result.push(chunks[i])
    }

    return result
  }
)
