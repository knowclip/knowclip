import tempy from 'tempy'
import { existsSync } from 'fs'

export const getWaveformPngPath = (constantBitrateFilePath: MediaFilePath) => {
  const pngId = 'waveform_png_for_' + constantBitrateFilePath
  let outputFilename = localStorage.getItem(pngId)
  if (outputFilename && existsSync(outputFilename)) {
    return outputFilename
  }
  outputFilename = tempy.file({ extension: 'png' })
  localStorage.setItem(pngId, outputFilename)
  return outputFilename
}

export const saveProjectToLocalStorage = (project: Project4_1_0) => {
  localStorage.setItem('project_' + project.id, JSON.stringify(project))
}
