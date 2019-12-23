import { initialState as initialFilesState } from '../reducers/files'
import { initialState as initialFileAvailabilitiesState } from '../reducers/fileAvailabilities'
import moment from 'moment'

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
    const projectsText = window.localStorage.getItem('projects')
    const projects = projectsText
      ? (JSON.parse(projectsText) as ProjectsState)
      : null
    const convertedProjectFiles: Record<string, ProjectFile> = {
      ...Object.values(projects ? projects.byId : {}).reduce(
        (all, oldProject) => {
          const newProject: ProjectFile = {
            type: 'ProjectFile',
            lastOpened: moment.utc().format(),
            lastSaved: '2015-11-16T09:44:45Z',
            id: oldProject.id,
            name: oldProject.name,
            noteType: oldProject.noteType,
            mediaFileIds: oldProject.mediaFileIds,
            error: null,
          }
          all[oldProject.id] = newProject
          return all
        },
        {} as Record<string, ProjectFile>
      ),
    }
    const oldProjectFiles: Record<string, FileAvailability> = {
      ...Object.values(projects ? projects.byId : {}).reduce(
        (all, oldProject) => {
          const newProject: FileAvailability = {
            id: oldProject.id,
            status: 'REMEMBERED',
            filePath: oldProject.filePath,
          }
          all[oldProject.id] = newProject
          return all
        },
        {} as Record<string, FileAvailability>
      ),
    }

    const settingsText = window.localStorage.getItem('settings')
    const settings = settingsText
      ? (JSON.parse(settingsText) as SettingsState)
      : null
    if (settings) persistedState.settings = settings

    const filesText = window.localStorage.getItem('files')
    const files = filesText ? (JSON.parse(filesText) as FilesState) : null

    persistedState.files = files
      ? {
          ...files,
          ProjectFile: {
            ...convertedProjectFiles,
            ...files.ProjectFile,
          },
        }
      : {
          ...initialFilesState,
          ProjectFile: {
            ...initialFilesState.ProjectFile,
            ...convertedProjectFiles,
          },
        }

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
      ProjectFile: {
        ...initialFileAvailabilitiesState.ProjectFile,
        ...oldProjectFiles,
        ...(storedFiles ? storedFiles.ProjectFile : null),
      },
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
            }
          case 'REMEMBERED':
            return {
              id: fileAvailability.id,
              status: fileAvailability.status,
              filePath: fileAvailability.filePath,
            }
          case 'NOT_LOADED':
            return {
              id: fileAvailability.id,
              status: fileAvailability.status,
              filePath: fileAvailability.filePath,
            }
        }
      }
    )
  } catch (err) {
    console.error(err)
  }

  return persistedState
}
