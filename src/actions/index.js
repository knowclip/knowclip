const localFlashcardKey = (file) => `${file.type}_____${file.name}`
const setLocalFlashcard = (flashcard) => {
  const { localStorage } = window
  if (localStorage) {
    const serializedFlashcardData = JSON.stringify({ en: flashcard.en, de: flashcard.de })
    localStorage.setItem(localFlashcardKey(flashcard.file), serializedFlashcardData)
  }
}

const getLocalFlashcard = (file) => {
  const { localStorage } = window
  if (localStorage) {
    const local = localStorage.getItem(localFlashcardKey(file))
    return local ? { ...JSON.parse(local), file } : null
  }
}

const getFlashcards = (files) => {
  const map = {};
  files.forEach(file => {
    const local = getLocalFlashcard(file)
    map[file.name] = local || { de: '', en: '' }
  })
  return map
}

export const initializeFlashcards = (files) => ({
  type: 'INITIALIZE_FLASHCARDS',
  flashcards: getFlashcards(files),
  filenames: files.map(f => f.name),
})

export const setFlashcardField = (id, key, value) => ({
  type: 'SET_FLASHCARD_FIELD',
  id,
  key,
  value,
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
