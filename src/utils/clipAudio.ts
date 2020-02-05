import ffmpeg, { toTimestamp } from '../utils/ffmpeg'

const clipAudio = (
  sourceFilePath: string,
  startTime: number,
  endTime: number,
  outputFilename: string
): Promise<string> => {
  return new Promise((res, rej) => {
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
}
export default clipAudio
