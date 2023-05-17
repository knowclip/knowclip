import { getPreloadModule } from './getPreloadModule'

const { parseSync, stringifySync } = getPreloadModule('subtitle')

export { parseSync, stringifySync }
