import { combineReducers } from 'redux'

import audio from './audio'
import flashcards from './flashcards'
import waveform from './waveform'
import clips from './clips'
import user from './user'

export default combineReducers({
  audio,
  flashcards,
  waveform,
  clips,
  user,
})
