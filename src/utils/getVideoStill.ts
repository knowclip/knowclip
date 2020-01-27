import ffmpeg, { AsyncError } from '../utils/ffmpeg'
import { existsSync } from 'fs'
import { getFileAvailabilityById } from '../redux'
import tempy from 'tempy'

export const VIDEO_STILL_HEIGHT = 150

export const getVideoStill = async (
  state: AppState,
  file: VideoStillImageFile,
  constantBitrateFilePath: string,
  seconds: number
): Promise<string | Error> => {
  try {
    const outputFilePath = getVideoStillPngPath(state, file)
    if (outputFilePath && existsSync(outputFilePath)) return outputFilePath

    return await new Promise((res, rej) => {
      ffmpeg(constantBitrateFilePath)
        .seekInput(seconds)
        .outputOptions('-vframes 1')
        .size(`?x${VIDEO_STILL_HEIGHT}`)
        .output(outputFilePath)
        .on('end', function() {
          res(outputFilePath)
        })
        .on('error', (err: any) => {
          rej(err)
        })
        .run()
    })
  } catch (err) {
    return new AsyncError(err)
  }
}

const getVideoStillPngPath = (state: AppState, file: VideoStillImageFile) => {
  const fileAvailability = getFileAvailabilityById(
    state,
    'VideoStillImage',
    file.id
  )
  if (fileAvailability.filePath && existsSync(fileAvailability.filePath)) {
    return fileAvailability.filePath
  }
  return tempy.file({ extension: 'png' })
}
