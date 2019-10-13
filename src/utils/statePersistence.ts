export const getPersistedState = (): Partial<AppState> => {
  const persistedState: Partial<AppState> = {}
  try {
    const projectsText = window.localStorage.getItem('projects')
    const projects = projectsText
      ? (JSON.parse(projectsText) as ProjectsState)
      : null
    if (projects) persistedState.projects = projects

    const mediaText = window.localStorage.getItem('media')
    const media = mediaText ? (JSON.parse(mediaText) as MediaState) : null
    if (media) persistedState.media = media

    const settingsText = window.localStorage.getItem('settings')
    const settings = settingsText
      ? (JSON.parse(settingsText) as SettingsState)
      : null
    if (settings) persistedState.settings = settings
  } catch (err) {
    console.error(err)
  }

  return persistedState
}
