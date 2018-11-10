import { join } from 'path'

const ffmpeg = require('fluent-ffmpeg') // maybe get rid of define plugin and just get straight from lib?
const os = require('os')

const platform = os.platform() + '-' + os.arch()

const ffmpegPath = join('.', 'node_modules', '@ffmpeg-installer', platform, 'ffmpeg')

ffmpeg.setFfmpegPath(ffmpegPath)

export default ffmpeg
