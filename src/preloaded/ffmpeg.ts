import { getPreloadModule } from './getPreloadModule'

export const { ffmpeg, toTimestamp, getMediaMetadata, readMediaFile } =
  getPreloadModule('ffmpeg') || require('../preload/ffmpeg')
