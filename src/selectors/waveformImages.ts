import { createSelector } from 'reselect'
import { getCurrentMediaFile } from './currentMedia'
import { getWaveformIds } from '../utils/getWaveform'
import { getXAtMillisecondsFromWaveform } from '../utils/waveformCoordinates'

export const getWaveformImages = createSelector(
  getCurrentMediaFile,
  (state: AppState) => state.files.WaveformPng,
  (state: AppState) => state.fileAvailabilities.WaveformPng,
  (state: AppState) => state.waveform,
  (
    currentMediaFile,
    files,
    fileAvailabilities,
    waveform
  ): { file: WaveformPng; path: string; x: number }[] => {
    if (!currentMediaFile) return []
    const result: { file: WaveformPng; path: string; x: number }[] = []

    for (const id of getWaveformIds(currentMediaFile)) {
      const file = files[id]
      const availability = fileAvailabilities[id]
      if (file && availability && availability.status === 'CURRENTLY_LOADED') {
        result.push({
          file,
          path: availability.filePath,
          x: getXAtMillisecondsFromWaveform(waveform, file.startSeconds * 1000),
        })
      }
    }

    return result
  }
)
