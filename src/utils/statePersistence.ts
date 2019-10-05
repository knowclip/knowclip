export const getPersistedState = (): Partial<AppState> => {
  const persistedState: Partial<AppState> = {}
  try {
    const projectsText = window.localStorage.getItem('projects')
    const projects = projectsText
      ? (JSON.parse(projectsText) as ProjectsState)
      : null
    if (projects) persistedState.projects = projects

    const audioText = window.localStorage.getItem('audio')
    const audio = audioText ? (JSON.parse(audioText) as MediaState) : null
    if (audio) persistedState.audio = audio
  } catch (err) {
    console.error(err)
  }

  return persistedState
}
