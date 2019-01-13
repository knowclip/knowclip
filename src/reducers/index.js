import { combineReducers } from 'redux'

import audio from './audio'
import waveform from './waveform'
import clips from './clips'
import user from './user'
import snackbar from './snackbar'
import dialog from './dialog'
import noteTypes from './noteTypes'

export default combineReducers({
  audio,
  waveform,
  clips,
  user,
  snackbar,
  dialog,
  noteTypes,
})
