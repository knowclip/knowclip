const localFlashcardKey = (file) => `${file.type}_____${file.name}`

export const setLocalFlashcard = (flashcard) => {
  const { localStorage } = window
  if (localStorage) {
    if (!flashcard.file)
      return console.log('not setting local flashcard')
    const serializedFlashcardData = JSON.stringify({ en: flashcard.en, de: flashcard.de })
    localStorage.setItem(localFlashcardKey(flashcard.file), serializedFlashcardData)
  }
}

const getLocalFlashcard = (file) => {
  const { localStorage } = window
  if (localStorage) {
    if (!file) {
      console.log('not getting local flashcard')
      return {}
    }
    const local = localStorage.getItem(localFlashcardKey(file))
    return local ? { ...JSON.parse(local), file } : null
  }
}

export const getLocalFlashcards = (files) => {
  const map = {};
  files.forEach(file => {
    const local = getLocalFlashcard(file)
    map[file.name] = local || { de: '', en: '', file }
  })
  return map
}
