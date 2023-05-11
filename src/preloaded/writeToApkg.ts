import { getPreloadModule } from './getPreloadModule'

export const { writeToApkg, writeApkgDeck } =
  getPreloadModule('writeToApkg') || require('../preload/writeToApkg')
