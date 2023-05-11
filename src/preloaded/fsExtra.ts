import { getPreloadModule } from './getPreloadModule'

export const { readdir } = getPreloadModule('fsExtra') || require('fs-extra')
