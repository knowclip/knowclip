import { getPreloadModule } from './getPreloadModule'

const { open, ZipFile, Entry } = getPreloadModule('yauzl') || require('yauzl')

export { open, ZipFile, Entry }
