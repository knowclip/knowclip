export const getPersistedState = () => {
  const persistedState = {}
  try {
    const projects = JSON.parse(window.localStorage.getItem('projects'))
    if (projects) persistedState.projects = projects

    const audio = JSON.parse(window.localStorage.getItem('audio'))
    if (audio) persistedState.audio = audio
  } catch (err) {
    console.error(err)
  }

  return persistedState
}
