import { combineReducers } from 'redux'

import waveform from './waveform'
import clips from './clips'
import user from './user'
import snackbar from './snackbar'
import dialog from './dialog'
import subtitles from './subtitles'
import settings from './settings'
import loadedFiles from './loadedFiles'
import fileRecords from './fileRecords'

export default combineReducers<AppState>({
  waveform,
  clips,
  user,
  snackbar,
  dialog,
  subtitles,
  settings,
  loadedFiles,
  fileRecords,
})
