import ffmpeg, { AsyncError } from '../utils/ffmpeg'
import { existsSync } from 'fs'
import tempy from 'tempy'
import { join, basename } from 'path'
import filenamify from 'filenamify'

export const VIDEO_STILL_HEIGHT = 150

export const getVideoStill = async (
  clipId: ClipId,
  videoFilePath: string,
  seconds: number
): Promise<string | Error> => {
  try {
    const outputFilePath = getVideoStillPngPath(clipId, videoFilePath, seconds)
    if (outputFilePath && existsSync(outputFilePath)) return outputFilePath

    await new Promise((res, rej) => {
      ffmpeg(videoFilePath)
        .seekInput(seconds.toFixed(3))
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

    if (!existsSync(outputFilePath))
      throw new Error(
        `Problem creating still from ${basename(
          videoFilePath
        )} at ${seconds} seconds.`
      )

    return outputFilePath
  } catch (err) {
    return new AsyncError(err)
  }
}

export const getVideoStillPngPath = (
  id: string,
  videoFilePath: string,
  seconds: number
) =>
  join(
    tempy.root,
    `${filenamify(basename(videoFilePath))}_${~~(seconds * 1000)}_${id}.png`
  )

export const getMidpoint = (start: number, end: number) =>
  start + Math.round((end - start) / 2)
