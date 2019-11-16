import tempy from 'tempy'
import { existsSync } from 'fs'
import { getLoadedFileById } from '../selectors'

export const getWaveformPngPath = (
  state: AppState,
  fileRecord: WaveformPngRecord
) => {
  const file = getLoadedFileById(state, 'WaveformPng', fileRecord.id)
  if (file && file.filePath && existsSync(file.filePath)) {
    return file.filePath
  }
  return tempy.file({ extension: 'png' })
}

export const saveProjectToLocalStorage = (project: Project4_1_0) => {
  localStorage.setItem('project_' + project.id, JSON.stringify(project))
}
