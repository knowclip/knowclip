import { getPreloadModule } from './getPreloadModule'

const { platform } = getPreloadModule('os') || require('os')

export { platform }
