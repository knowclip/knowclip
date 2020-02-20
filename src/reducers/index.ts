import { combineReducers } from 'redux'

import waveform from './waveform'
import clips from './clips'
import session from './session'
import snackbar from './snackbar'
import dialog from './dialog'
import subtitles from './subtitles'
import linkedSubtitles from './linkedSubtitles'
import settings from './settings'
import fileAvailabilities from './fileAvailabilities'
import files from './files'

export default combineReducers<AppState>({
  waveform,
  clips,
  session,
  snackbar,
  dialog,
  subtitles,
  linkedSubtitles,
  settings,
  fileAvailabilities,
  files,
})
