import { combineReducers } from 'redux'

import audio from './audio'
import flashcards from './flashcards'
import waveform from './waveform'

export default combineReducers({
  audio,
  flashcards,
  waveform,
})
