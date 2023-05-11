import { getPreloadModule } from './getPreloadModule'

export const { existsSync, readFile, writeFile, writeFileSync } =
  getPreloadModule('fs') || require('../preload/fs')
