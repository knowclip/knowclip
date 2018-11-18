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

export const toTimestamp = (milliseconds, millisecondsSeparator = '.') => {
  const millisecondsStamp = String(Math.round(milliseconds % 1000)).padStart(
    3,
    '0'
  )
  const secondsStamp = String(Math.floor(milliseconds / 1000) % 60).padStart(
    2,
    '0'
  )
  const minutesStamp = String(
    Math.floor(milliseconds / 1000 / 60) % 60
  ).padStart(2, '0')
  const hoursStamp = String(Math.floor(milliseconds / 1000 / 60 / 60)).padStart(
    3,
    '0'
  )
  return `${hoursStamp}:${minutesStamp}:${secondsStamp}${millisecondsSeparator}${millisecondsStamp}`
}
