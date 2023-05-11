import { getPreloadModule } from './getPreloadModule'

export const { writeToApkg, writeApkgDeck } =
  getPreloadModule('writeToApkg') || require('writeToApkg')
