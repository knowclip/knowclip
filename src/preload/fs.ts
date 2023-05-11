import { getPreloadModule } from './getPreloadModule'

export const { existsSync, readFile, writeFile } =
  getPreloadModule('fs') || require('fs')
