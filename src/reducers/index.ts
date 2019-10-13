import { combineReducers } from 'redux'

import media from './media'
import waveform from './waveform'
import clips from './clips'
import user from './user'
import snackbar from './snackbar'
import dialog from './dialog'
import projects from './projects'
import subtitles from './subtitles'
import settings from './settings'

export default combineReducers<AppState>({
  media,
  waveform,
  clips,
  user,
  snackbar,
  dialog,
  projects,
  subtitles,
  settings,
})
