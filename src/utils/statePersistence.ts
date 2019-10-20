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
      persistedState.loadedFiles = Object.entries(loadedFiles)
        .map(
          ([id, loadedFilev]): NotCurrentlyLoadedFile => {
            const loadedFile: LoadedFile = loadedFilev as LoadedFile

            switch (loadedFile.status) {
              case 'CURRENTLY_LOADED':
                return {
                  id,
                  status: 'REMEMBERED',
                  filePath: loadedFile.filePath,
                }
              case 'REMEMBERED':
                return {
                  id,
                  status: loadedFile.status,
                  filePath: loadedFile.filePath,
                }
              case 'NOT_LOADED':
                return {
                  id,
                  status: loadedFile.status,
                  filePath: loadedFile.filePath,
                }
            }
          }
        )
        .reduce(
          (all, newLoadedFile) => {
            all[newLoadedFile.id] = newLoadedFile
            return all
          },
          {} as LoadedFilesState
        )
  } catch (err) {
    console.error(err)
  }

  return persistedState
}
