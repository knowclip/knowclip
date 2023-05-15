import { ffmpeg } from './ffmpeg'
import { existsSync } from 'fs'
import tempy from 'tempy'
import { join, basename } from 'path'
import { sanitizeFileName } from '../utils/sanitizeFilename'

export const VIDEO_STILL_HEIGHT = 150

export const getVideoStill = async (
  clipId: ClipId,
  videoFilePath: string,
  seconds: number
): AsyncResult<string> => {
  try {
    const outputFilePath = getVideoStillPngPath(clipId, videoFilePath, seconds)
    if (outputFilePath && existsSync(outputFilePath))
      return { value: outputFilePath }

    await new Promise((res, rej) => {
      ffmpeg(videoFilePath)
        .seekInput(seconds.toFixed(3))
        .outputOptions('-vframes 1')
        .size(`?x${VIDEO_STILL_HEIGHT}`)
        .output(outputFilePath)
        .on('end', function () {
          res({ value: outputFilePath })
        })
        .on('error', (err: any) => {
          console.error(
            `Could not make still from ${videoFilePath} at ${seconds} seconds`
          )
          console.error(err)
          rej(err)
        })
        .run()
    })

    if (!existsSync(outputFilePath))
      throw new Error(
        `Problem creating still from ${basename(
          videoFilePath
        )} at ${seconds} seconds.`
      )

    return { value: outputFilePath }
  } catch (error) {
    return { errors: [String(error)] }
  }
}

export const getVideoStillPngPath = (
  id: string,
  videoFilePath: string,
  seconds: number
) =>
  join(
    tempy.root,
    `${sanitizeFileName(basename(videoFilePath)).slice(0, 40)}_${seconds
      .toFixed(3)
      .replace('.', '-')}_${id}.png`
  )
