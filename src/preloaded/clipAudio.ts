import { getPreloadModule } from './getPreloadModule'

export const clipAudio =
  getPreloadModule('clipAudio') || require('../preload/clipAudio')
