import { combineReducers } from 'redux'

import waveform from './waveform'
import clips from './clips'
import user from './user'
import snackbar from './snackbar'
import dialog from './dialog'
import subtitles from './subtitles'
import settings from './settings'
import fileAvailabilities from './fileAvailabilities'
import files from './files'

export default combineReducers<AppState>({
  waveform,
  clips,
  user,
  snackbar,
  dialog,
  subtitles,
  settings,
  fileAvailabilities,
  files,
})
