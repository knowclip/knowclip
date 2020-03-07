import ffmpeg, { toTimestamp } from '../utils/ffmpeg'
import { existsSync } from 'fs-extra'

import { Writable } from 'stream'

export const clipAudioStream = (
  sourceFilePath: string,
  startTime: number,
  endTime: number,
  outputFilename: string
): { done: Promise<string>; stream: Writable } => {
  const mp3 = ffmpeg(sourceFilePath)
    // .audioCodec('copy') // TODO: do this and change hardcoded '.mp3' for audio-only input
    .seekInput(toTimestamp(startTime))
    .inputOptions('-to ' + toTimestamp(endTime))
    .outputOptions('-vn')
    .outputFormat('mp3')
  return {
    done: new Promise((res, rej) => {
      mp3
        .on('end', () => {
          console.log('done!', outputFilename)
          res(outputFilename)
        })
        .on('error', err => {
          console.error(err)
          rej(err)
        })
    }),
    stream: mp3.pipe(),
  }
}

const clipAudio = async (
  sourceFilePath: string,
  startTime: number,
  endTime: number,
  outputFilename: string
): Promise<string> => {
  const result = await new Promise((res, rej) => {
    ffmpeg(sourceFilePath)
      // .audioCodec('copy') // TODO: do this and change hardcoded '.mp3' for audio-only input
      .seekInput(toTimestamp(startTime))
      .inputOptions('-to ' + toTimestamp(endTime))
      .outputOptions('-vn')
      .output(outputFilename)
      .on('end', () => {
        res(outputFilename)
      })
      .on('error', err => {
        console.error(err)
        rej(err)
      })
      .run()
  })

  if (!result || !existsSync(outputFilename)) {
    console.log({ outputFilename, sourceFilePath, startTime, endTime })
    throw new Error(`Problem clipping audio from ${sourceFilePath}`)
  }

  return outputFilename
}
export default clipAudio
