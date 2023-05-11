import { ffmpeg, toTimestamp } from '../preloaded/ffmpeg'

import type { Writable } from 'stream'
import { existsSync } from '../preloaded/fs'

export const clipAudioStream = (
  sourceFilePath: string,
  startTime: number,
  endTime: number,
  outputFilePath: string
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
          console.log('done!', outputFilePath)
          res(outputFilePath)
        })
        .on('error', (err) => {
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
  outputFilePath: string
): AsyncResult<string> => {
  const result = await new Promise((res, rej) => {
    ffmpeg(sourceFilePath)
      // .audioCodec('copy') // TODO: do this and change hardcoded '.mp3' for audio-only input
      .seekInput(toTimestamp(startTime))
      .inputOptions('-to ' + toTimestamp(endTime))
      .outputOptions('-vn')
      .output(outputFilePath)
      .on('end', () => {
        res(outputFilePath)
      })
      .on('error', (err) => {
        console.error(err)
        console.log({
          sourceFilePath,
          startTime,
          endTime,
          outputFilePath,
        })
        rej({ errors: [err] })
      })
      .run()
  })

  if (!result || !existsSync(outputFilePath)) {
    console.log({ outputFilePath, sourceFilePath, startTime, endTime })
    throw new Error(`Problem clipping audio from ${sourceFilePath}`)
  }

  return { value: outputFilePath }
}
export default clipAudio
