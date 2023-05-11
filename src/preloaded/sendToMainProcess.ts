import { getPreloadModule } from './getPreloadModule'

export const sendToMainProcess =
  getPreloadModule('sendToMainProcess') ||
  require('../preload/sendToMainProcess')
