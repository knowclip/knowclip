import tempy from 'tempy'
import { existsSync } from 'fs'

export const getWaveformPngPath = (
  constantBitrateFilePath: MediaFilePath
): string => {
  const pngId = 'waveform_png_for_' + constantBitrateFilePath
  let outputFilename = localStorage.getItem(pngId)
  if (outputFilename && existsSync(outputFilename)) {
    return outputFilename
  }
  outputFilename = tempy.file({ extension: 'png' })
  localStorage.setItem(pngId, outputFilename)
  return outputFilename
}

export const getConstantBitrateMp3Path = path => {
  const storedPath = localStorage.getItem(path)
  if (storedPath) return storedPath

  const tmpPath = tempy.file({ extension: 'mp3' })
  localStorage.setItem('constant_bitrate_mp3_for_' + path, tmpPath)
  return tmpPath
}

export const saveProjectToLocalStorage = (project: Project2_0_0) => {
  localStorage.getItem('project_' + project.id, project)
}
