import { getLocalFlashcards } from '../localFlashcards'

export const initializeFlashcards = (files) => ({
  type: 'INITIALIZE_FLASHCARDS',
  flashcards: getLocalFlashcards(files),
  filenames: files.map(f => f.name),
})

export const setFlashcardField = (id, key, value) => ({
  type: 'SET_FLASHCARD_FIELD',
  id,
  key,
  value,
})

export const loadAudio = (file, audioElement) => ({
  type: 'LOAD_AUDIO',
  file,
  audioElement,
})

export const setWaveformPath = (path) => ({
  type: 'SET_WAVEFORM_PATH',
  path,
})

export const setCurrentFlashcard = (index) => ({
  type: 'SET_CURRENT_FLASHCARD',
  index,
})

export const toggleLoop = () => ({
  type: 'TOGGLE_LOOP',
})
