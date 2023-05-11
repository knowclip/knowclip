import { getPreloadModule } from './getPreloadModule'

export const { file, directory, root } =
  getPreloadModule('tempy') || require('tempy')
