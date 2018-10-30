import { getLocalFlashcards } from '../utils/localFlashcards'

export const initializeFlashcards = (files) => ({
  type: 'INITIALIZE_FLASHCARDS',
  flashcards: {},
  // should read from file or database or something...
  filenames: files.map(f => f.name),
})

export const setFlashcardField = (id, key, value) => ({
  type: 'SET_FLASHCARD_FIELD',
  id,
  key,
  value,
})

export const loadAudio = (file, audioElement, svgElement) => ({
  type: 'LOAD_AUDIO',
  file,
  audioElement,
  svgElement,
})

export const setCurrentFile = (index) => ({
  type: 'SET_CURRENT_FILE',
  index,
})

export const toggleLoop = () => ({
  type: 'TOGGLE_LOOP',
})

export const loadAudioSuccess = ({ filename, bufferLength }) => ({
  type: 'LOAD_AUDIO_SUCCESS',
  filename,
  bufferLength,
})

export const deleteCard = id => ({
  type: 'DELETE_CARD',
  id,
})

export * from './waveform'
