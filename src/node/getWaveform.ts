import * as tempy from 'tempy'
import { existsSync } from 'fs'
import { basename, join } from 'path'
import { createWaveformPng } from './createWaveformPng'
import {
  getWaveformIds,
  WAVEFORM_SEGMENT_LENGTH,
} from '../utils/getWaveformIds'
import { failure } from '../utils/result'

const WAVEFORM_PNG_PIXELS_PER_SECOND = 50

export const getWaveformPng = async (
  fileAvailability: FileAvailability,
  file: WaveformPng,
  mediaFilePath: string
): AsyncResult<string> => {
  try {
    const startX = WAVEFORM_PNG_PIXELS_PER_SECOND * file.startSeconds
    const endX = WAVEFORM_PNG_PIXELS_PER_SECOND * file.endSeconds
    const width = ~~(endX - startX)
    const outputFilename = getWaveformPngPath(
      fileAvailability,
      mediaFilePath,
      file
    )
    if (outputFilename && existsSync(outputFilename))
      return { value: outputFilename }

    const newFileName: string = await createWaveformPng(
      mediaFilePath,
      file,
      width,
      outputFilename
    )

    if (!newFileName || !existsSync(newFileName))
      throw new Error('Problem creating waveform image')

    return { value: newFileName }
  } catch (error) {
    return failure(error)
  }
}

const getWaveformPngPath = (
  fileAvailability: FileAvailability,
  mediaFilePath: string,
  file: WaveformPng
) => {
  if (fileAvailability.filePath && existsSync(fileAvailability.filePath)) {
    return fileAvailability.filePath
  }

  return join(
    tempy.rootTemporaryDirectory,
    basename(mediaFilePath) + '_' + file.id + '.png'
  )
}

export const getWaveformPngs = (mediaFile: MediaFile): WaveformPng[] => {
  const { durationSeconds } = mediaFile

  return getWaveformIds(mediaFile).map(
    (id, i): WaveformPng => ({
      type: 'WaveformPng',
      parentId: mediaFile.id,
      id,
      startSeconds: i * WAVEFORM_SEGMENT_LENGTH,
      endSeconds: Math.min(durationSeconds, (i + 1) * WAVEFORM_SEGMENT_LENGTH),
    })
  )
}
