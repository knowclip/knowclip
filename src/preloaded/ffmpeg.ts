import { getPreloadModule } from './getPreloadModule'

export const {
  toTimestamp,
  getMediaMetadata,
  readMediaFile,
  writeMediaSubtitlesToVtt,
  convertAssToVtt,
  createConstantBitrateMp3,
} = getPreloadModule('ffmpeg')
