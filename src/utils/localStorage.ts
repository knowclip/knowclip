import tempy from 'tempy'
import { existsSync } from 'fs'
import { getFileAvailabilityById } from '../selectors'

export const getWaveformPngPath = (state: AppState, file: WaveformPng) => {
  const fileAvailability = getFileAvailabilityById(
    state,
    'WaveformPng',
    file.id
  )
  if (
    fileAvailability &&
    fileAvailability.filePath &&
    existsSync(fileAvailability.filePath)
  ) {
    return fileAvailability.filePath
  }
  return tempy.file({ extension: 'png' })
}

export const saveProjectToLocalStorage = (project: Project4_1_0) => {
  localStorage.setItem('project_' + project.id, JSON.stringify(project))
}
