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

    const fileRecordsText = window.localStorage.getItem('fileRecords')
    const fileRecords = fileRecordsText
      ? (JSON.parse(fileRecordsText) as FileRecordsState)
      : null
    if (fileRecords) persistedState.fileRecords = fileRecords

    const loadedFilesText = window.localStorage.getItem('loadedFiles')
    const loadedFiles = loadedFilesText
      ? (JSON.parse(loadedFilesText) as LoadedFilesState)
      : null
    if (loadedFiles)
      persistedState.loadedFiles = Object.entries(loadedFiles).reduce(
        (all, [id, loadedFile]) => {
          all[id] = {
            ...loadedFile,
            loaded: false,
          }
          return all
        },
        {} as LoadedFilesState
      )
  } catch (err) {
    console.error(err)
  }

  return persistedState
}
