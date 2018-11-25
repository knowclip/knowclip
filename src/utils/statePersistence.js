export const persistState = state => {
  const { audio, clips, flashcards } = state
  window.localStorage.setItem('audio', JSON.stringify(audio))
  window.localStorage.setItem('clips', JSON.stringify(clips))
  window.localStorage.setItem('flashcards', JSON.stringify(flashcards))
}

export const getPersistedState = () => {
  const persistedState = {}
  const stateParts = ['audio', 'clips', 'flashcards']
  stateParts.forEach(x => {
    const stored = window.localStorage.getItem(JSON.parse(x))
    if (!stored) return
    persistedState[x] = stored
  })
  return persistedState
}
