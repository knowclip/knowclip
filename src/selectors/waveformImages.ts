import { createSelector } from 'reselect'
import { getCurrentMediaFile } from './currentMedia'
import { getWaveformIds } from '../utils/getWaveformIds'
import { fileByIdUrl } from './files'

export const getWaveformImages = createSelector(
  getCurrentMediaFile,
  (state: AppState) => state.files.WaveformPng,
  (state: AppState) => state.fileAvailabilities.WaveformPng,
  (state: AppState) => state.session.localServerAddress,
  (currentMediaFile, files, fileAvailabilities, localServerAddress) => {
    if (!currentMediaFile) return []
    const result: { file: WaveformPng; url: string }[] = []

    for (const id of getWaveformIds(currentMediaFile)) {
      const file = files[id]
      const availability = fileAvailabilities[id]
      if (file && availability && availability.status === 'CURRENTLY_LOADED') {
        result.push({
          file,
          url: fileByIdUrl(localServerAddress, id),
        })
      }
    }

    return result
  }
)
