import { getPreloadModule } from './getPreloadModule'

const { open, ZipFile, Entry } = getPreloadModule('yauzl')

export { open, ZipFile, Entry }
