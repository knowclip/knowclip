import { createSelector } from 'reselect'
import { getCurrentMediaFile } from './currentMedia'
import { getWaveformIds } from '../utils/getWaveform'

export const getWaveformImages = createSelector(
  getCurrentMediaFile,
  (state: AppState) => state.files.WaveformPng,
  (state: AppState) => state.fileAvailabilities.WaveformPng,
  (
    currentMediaFile,
    files,
    fileAvailabilities
  ): { file: WaveformPng; path: string; x: number }[] => {
    if (!currentMediaFile) return []
    // properly, X should be "startMs"
    const result: { file: WaveformPng; path: string; x: number }[] = []

    for (const id of getWaveformIds(currentMediaFile)) {
      const file = files[id]
      const availability = fileAvailabilities[id]
      if (file && availability && availability.status === 'CURRENTLY_LOADED') {
        result.push({
          file,
          path: availability.filePath,
          x: file.startSeconds * 1000,
        })
      }
    }

    return result
  }
)
