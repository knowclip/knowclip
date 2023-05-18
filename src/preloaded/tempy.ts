import { getPreloadModule } from './getPreloadModule'

export const { temporaryFile, temporaryDirectory, rootTemporaryDirectory } =
  getPreloadModule('tempy')
