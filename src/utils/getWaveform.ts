import * as tempy from 'preloaded/tempy'
import { existsSync } from 'preloaded/fs'
import { getFileAvailabilityById } from '../selectors'
import { basename, join } from 'preloaded/path'
import { createWaveformPng } from 'preloaded/createWaveformPng'

const WAVEFORM_PNG_PIXELS_PER_SECOND = 50

export const getWaveformPng = async (
  state: AppState,
  file: WaveformPng,
  mediaFilePath: string
): AsyncResult<string> => {
  try {
    const startX = WAVEFORM_PNG_PIXELS_PER_SECOND * file.startSeconds
    const endX = WAVEFORM_PNG_PIXELS_PER_SECOND * file.endSeconds
    const width = ~~(endX - startX)
    const outputFilename = getWaveformPngPath(state, mediaFilePath, file)
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
    return { errors: [String(error)] }
  }
}

const getWaveformPngPath = (
  state: AppState,
  mediaFilePath: string,
  file: WaveformPng
) => {
  const fileAvailability = getFileAvailabilityById(
    state,
    'WaveformPng',
    file.id
  )
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
const WAVEFORM_SEGMENT_LENGTH = 5 * 60
// TODO: investigate why this produced an empty
//       second segment for pbc demo video when set to 2 minutes
function getWaveformId(mediaFileId: MediaFileId, i: number): string {
  return mediaFileId + '__' + i
}

export function getWaveformIds(mediaFile: MediaFile) {
  const { durationSeconds } = mediaFile
  const segmentsCount = Math.ceil(durationSeconds / WAVEFORM_SEGMENT_LENGTH)
  return [...Array(segmentsCount).keys()].map((index) =>
    getWaveformId(mediaFile.id, index)
  )
}
