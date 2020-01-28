import { initialState as initialFilesState } from '../reducers/files'
import { initialState as initialFileAvailabilitiesState } from '../reducers/fileAvailabilities'

type FilesyState<F> = Record<FileMetadata['type'], { [fileId: string]: F }>

const mapFileState = <F, G>(state: FilesyState<F>, transform: (f: F) => G) =>
  (Object.keys(state) as FileMetadata['type'][]).reduce(
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
    const settingsText = window.localStorage.getItem('settings')
    const settings = settingsText
      ? (JSON.parse(settingsText) as SettingsState)
      : null
    if (settings) persistedState.settings = settings

    const filesText = window.localStorage.getItem('files')
    const files = filesText ? (JSON.parse(filesText) as FilesState) : null

    if (files) persistedState.files = { ...initialFilesState, ...files }

    // should also check for orphans?

    const fileAvailabilitiesText = window.localStorage.getItem(
      'fileAvailabilities'
    )
    const storedFiles = fileAvailabilitiesText
      ? (JSON.parse(fileAvailabilitiesText) as FileAvailabilitiesState)
      : null
    const fileAvailabilities = {
      ...initialFileAvailabilitiesState,
      ...storedFiles,
    }

    persistedState.fileAvailabilities = mapFileState(
      fileAvailabilities,
      fileAvailability => {
        switch (fileAvailability.status) {
          case 'CURRENTLY_LOADED':
            return {
              id: fileAvailability.id,
              status: 'REMEMBERED',
              filePath: fileAvailability.filePath,
              isLoading: false,
            }
          case 'REMEMBERED':
            return {
              id: fileAvailability.id,
              status: fileAvailability.status,
              filePath: fileAvailability.filePath,
              isLoading: false,
            }
          case 'NOT_LOADED':
            return {
              id: fileAvailability.id,
              status: fileAvailability.status,
              filePath: fileAvailability.filePath,
              isLoading: false,
            }
        }
      }
    )
  } catch (err) {
    console.error(err)
  }

  return persistedState
}
