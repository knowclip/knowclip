import { getPreloadModule } from './getPreloadModule'

const { shell } = getPreloadModule('electron') || require('../preload/electron')

export { shell }
