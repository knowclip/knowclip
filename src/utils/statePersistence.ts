import { initialState as initialFilesState } from '../reducers/files'
import { initialState as initialFileAvailabilitiesState } from '../reducers/fileAvailabilities'

type FilesyState<F> = Record<FileMetadata['type'], { [fileId: string]: F }>

const mapFileState = <F, G>(
  state: FilesyState<F>,
  transform: (type: FileMetadata['type'], f: F) => G
) =>
  (Object.keys(state) as FileMetadata['type'][]).reduce(
    (all, type) => {
      all[type] = Object.keys(state[type]).reduce(
        (xxx, id) => {
          xxx[id] = transform(type, state[type][id])
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

    // if (files) persistedState.files = { ...initialFilesState, ...files }

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
      (type, fa): KnownFile => {
        const fileAvailability = fa as KnownFile
        const name = (files as FilesState)[type][fileAvailability.id]
        switch (fileAvailability.status) {
          case 'CURRENTLY_LOADED':
            return {
              id: fileAvailability.id,
              type: fileAvailability.type,
              parentId: fileAvailability.parentId,
              name: fileAvailability.name,
              status: 'PREVIOUSLY_LOADED',
              filePath: fileAvailability.filePath,
              isLoading: false,
              lastOpened: fileAvailability.lastOpened,
            }

          case 'PENDING_DELETION':
            return fileAvailability.lastOpened && fileAvailability.filePath
              ? {
                  id: fileAvailability.id,
                  type: fileAvailability.type,
                  parentId: fileAvailability.parentId,
                  name: fileAvailability.name,
                  filePath: fileAvailability.filePath,
                  lastOpened: fileAvailability.lastOpened,
                  isLoading: false,
                  status: 'PREVIOUSLY_LOADED',
                }
              : {
                  id: fileAvailability.id,
                  type: fileAvailability.type,
                  parentId: fileAvailability.parentId,
                  name: fileAvailability.name,
                  filePath: fileAvailability.filePath,
                  lastOpened: null,
                  isLoading: false,
                  status: 'NEVER_LOADED',
                }
          case 'FAILED_TO_LOAD':
            return {
              id: fileAvailability.id,
              type: fileAvailability.type,
              parentId: fileAvailability.parentId,
              name: fileAvailability.name,
              status: fileAvailability.status,
              filePath: fileAvailability.filePath,
              isLoading: false,
              lastOpened: fileAvailability.lastOpened,
            }
          case 'PREVIOUSLY_LOADED':
            return {
              id: fileAvailability.id,
              type: fileAvailability.type,
              parentId: fileAvailability.parentId,
              name: fileAvailability.name,
              status: fileAvailability.status,
              filePath: fileAvailability.filePath,
              isLoading: false,
              lastOpened: fileAvailability.lastOpened,
            }
          case 'NEVER_LOADED':
            return {
              id: fileAvailability.id,
              type: fileAvailability.type,
              parentId: fileAvailability.parentId,
              name: fileAvailability.name,
              status: fileAvailability.status,
              filePath: fileAvailability.filePath,
              isLoading: false,
              lastOpened: fileAvailability.lastOpened,
            }
        }
      }
    )
  } catch (err) {
    console.error(err)
  }

  return persistedState
}
