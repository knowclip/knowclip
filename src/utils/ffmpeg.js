const ffmpeg = require('fluent-ffmpeg/lib/fluent-ffmpeg')

// have to do it this was cause of webpack
const ffmpegPath = require('electron').remote.getGlobal('ffmpegpath')

ffmpeg.setFfmpegPath(ffmpegPath)

export default ffmpeg

const zeroPad = (zeroes, value) => String(value).padStart(zeroes, '0')

export const toTimestamp = (milliseconds, millisecondsSeparator = '.') => {
  const millisecondsStamp = zeroPad(3, Math.round(milliseconds % 1000))
  const secondsStamp = zeroPad(2, Math.floor(milliseconds / 1000) % 60)
  const minutesStamp = zeroPad(2, Math.floor(milliseconds / 1000 / 60) % 60)
  const hoursStamp = zeroPad(2, Math.floor(milliseconds / 1000 / 60 / 60))
  return `${hoursStamp}:${minutesStamp}:${secondsStamp}${millisecondsSeparator}${millisecondsStamp}`
}
