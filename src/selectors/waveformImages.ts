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
  ): { file: WaveformPng; path: string }[] => {
    if (!currentMediaFile) return []
    const result: { file: WaveformPng; path: string }[] = []

    for (const id of getWaveformIds(currentMediaFile)) {
      const file = files[id]
      const availability = fileAvailabilities[id]
      if (file && availability && availability.status === 'CURRENTLY_LOADED') {
        result.push({
          file,
          path: availability.filePath,
        })
      }
    }

    return result
  }
)
