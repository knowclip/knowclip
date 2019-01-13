const ffmpeg = require('fluent-ffmpeg/lib/fluent-ffmpeg')

const setFfmpegPath = () => {
  if (process.env.JEST_WORKER_ID) return

  // have to do it this was cause of webpack
  const ffmpegPath = require('electron').remote.getGlobal('ffmpegpath')

  ffmpeg.setFfmpegPath(ffmpegPath)
}
setFfmpegPath()

export default ffmpeg

const zeroPad = (zeroes, value) => String(value).padStart(zeroes, '0')

export const toTimestamp = (milliseconds, millisecondsSeparator = '.') => {
  const millisecondsStamp = zeroPad(3, Math.round(milliseconds % 1000))
  const secondsStamp = zeroPad(2, Math.floor(milliseconds / 1000) % 60)
  const minutesStamp = zeroPad(2, Math.floor(milliseconds / 1000 / 60) % 60)
  const hoursStamp = zeroPad(2, Math.floor(milliseconds / 1000 / 60 / 60))
  return `${hoursStamp}:${minutesStamp}:${secondsStamp}${millisecondsSeparator}${millisecondsStamp}`
}
