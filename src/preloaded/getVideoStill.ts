import { getPreloadModule } from './getPreloadModule'

export const { getVideoStill, getVideoStillPngPath } =
  getPreloadModule('getVideoStill') || require('../preload/getVideoStill')
