type FilesyState<F> = Record<FileRecord['type'], { [fileId: string]: F }>

const mapFileState = <F, G>(state: FilesyState<F>, transform: (f: F) => G) =>
  (Object.keys(state) as FileRecord['type'][]).reduce(
    (all, type) => {
      all[type] = Object.keys(state[type]).reduce(
        (xxx, id) => {
          xxx[id] = transform(state[type][id])
          return xxx
        },
        {} as { [fileId: string]: G }
      )
      return all
    },
    {} as FilesyState<G>
  )

export const getPersistedState = (): Partial<AppState> => {
  const persistedState: Partial<AppState> = {}
  try {
    const projectsText = window.localStorage.getItem('projects')
    const projects = projectsText
      ? (JSON.parse(projectsText) as ProjectsState)
      : null
    if (projects) persistedState.projects = projects

    // const mediaText = window.localStorage.getItem('media')
    // const media = mediaText ? (JSON.parse(mediaText) as MediaState) : null
    // if (media) persistedState.media = media

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

    // should also check for orphans?

    // if (persistedState.fileRecords)
    //   persistedState.loadedFiles =

    const loadedFilesText = window.localStorage.getItem('loadedFiles')
    const loadedFiles = loadedFilesText
      ? (JSON.parse(loadedFilesText) as LoadedFilesState)
      : null

    if (loadedFiles)
      persistedState.loadedFiles = mapFileState(loadedFiles, loadedFile => {
        switch (loadedFile.status) {
          case 'CURRENTLY_LOADED':
            return {
              id: loadedFile.id,
              status: 'REMEMBERED',
              filePath: loadedFile.filePath,
            }
          case 'REMEMBERED':
            return {
              id: loadedFile.id,
              status: loadedFile.status,
              filePath: loadedFile.filePath,
            }
          case 'NOT_LOADED':
            return {
              id: loadedFile.id,
              status: loadedFile.status,
              filePath: loadedFile.filePath,
            }
        }
      })
  } catch (err) {
    console.error(err)
  }

  return persistedState
}
