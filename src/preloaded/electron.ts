import { getPreloadModule } from './getPreloadModule'

const { shell, sendClosedSignal } = getPreloadModule('electron')

export { shell, sendClosedSignal }
