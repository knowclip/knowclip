export const persistState = state => {
  const { audio, clips } = state
  window.localStorage.setItem('audio', JSON.stringify(audio))
  window.localStorage.setItem('clips', JSON.stringify(clips))
}

export const getPersistedState = () => {
  const persistedState = {}
  const stateParts = ['audio', 'clips']
  stateParts.forEach(x => {
    const stored = JSON.parse(window.localStorage.getItem(x))
    if (!stored) return
    persistedState[x] = stored
  })
  return persistedState
}
