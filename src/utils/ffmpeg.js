import { join } from 'path'

const ffmpeg = require('fluent-ffmpeg') // maybe get rid of define plugin and just get straight from lib?
const os = require('os')

const platform = os.platform() + '-' + os.arch()

const ffmpegPath = join(
  '.',
  'node_modules',
  '@ffmpeg-installer',
  platform,
  'ffmpeg'
)

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
