import { initialState as initialFileRecordsState } from '../reducers/fileRecords'
import { initialState as initialLoadedFilesState } from '../reducers/loadedFiles'
import moment from 'moment'

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
    const convertedProjectFileRecords: Record<string, ProjectFileRecord> = {
      ...Object.values(projects ? projects.byId : {}).reduce(
        (all, oldProject) => {
          const newProject: ProjectFileRecord = {
            type: 'ProjectFile',
            lastOpened: moment.utc().format(),
            lastSaved: '2015-11-16T09:44:45Z',
            id: oldProject.id,
            name: oldProject.name,
            noteType: oldProject.noteType,
            mediaFiles: oldProject.mediaFiles,
            error: null,
          }
          all[oldProject.id] = newProject
          return all
        },
        {} as Record<string, ProjectFileRecord>
      ),
    }
    const oldProjectLoadedFiles: Record<string, LoadedFile> = {
      ...Object.values(projects ? projects.byId : {}).reduce(
        (all, oldProject) => {
          const newProject: LoadedFile = {
            id: oldProject.id,
            status: 'REMEMBERED',
            filePath: oldProject.filePath,
          }
          all[oldProject.id] = newProject
          return all
        },
        {} as Record<string, LoadedFile>
      ),
    }

    const settingsText = window.localStorage.getItem('settings')
    const settings = settingsText
      ? (JSON.parse(settingsText) as SettingsState)
      : null
    if (settings) persistedState.settings = settings

    const fileRecordsText = window.localStorage.getItem('fileRecords')
    const fileRecords = fileRecordsText
      ? (JSON.parse(fileRecordsText) as FileRecordsState)
      : null

    persistedState.fileRecords = fileRecords
      ? {
          ...fileRecords,
          ProjectFile: {
            ...convertedProjectFileRecords,
            ...fileRecords.ProjectFile,
          },
        }
      : {
          ...initialFileRecordsState,
          ProjectFile: {
            ...initialFileRecordsState.ProjectFile,
            ...convertedProjectFileRecords,
          },
        }

    // should also check for orphans?

    const loadedFilesText = window.localStorage.getItem('loadedFiles')
    const storedLoadedFiles = loadedFilesText
      ? (JSON.parse(loadedFilesText) as LoadedFilesState)
      : null
    const loadedFiles = {
      ...initialLoadedFilesState,
      ...storedLoadedFiles,
      ProjectFile: {
        ...initialLoadedFilesState.ProjectFile,
        ...oldProjectLoadedFiles,
        ...(storedLoadedFiles ? storedLoadedFiles.ProjectFile : null),
      },
    }

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
