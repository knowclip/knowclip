import { getPreloadModule } from './getPreloadModule'

export const processNoteMedia =
  getPreloadModule('processNoteMedia') || require('../preload/processNoteMedia')
