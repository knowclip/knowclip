import { getPreloadModule } from './getPreloadModule'

const { basename, extname, dirname, resolve, join } = getPreloadModule('path')

export { basename, extname, dirname, resolve, join }
