import ffmpeg, { toTimestamp } from '../utils/ffmpeg'

const clipAudio = (sourceFilePath, startTime, endTime, outputFilename) => {
  return new Promise((res, rej) => {
    ffmpeg(sourceFilePath)
      // .audioCodec('copy') // later, do this and change hardcoded '.mp3' for audio-only input
      .seekInput(toTimestamp(startTime))
      .inputOptions('-to ' + toTimestamp(endTime))
      .outputOptions('-vn')
      .output(outputFilename)
      .on(
        'end',
        //listener must be a function, so to return the callback wrapping it inside a function
        function() {
          res(outputFilename)
        }
      )
      .on('error', err => {
        console.error(err)
        rej(err)
      })
      .run()
  })
}
export default clipAudio
