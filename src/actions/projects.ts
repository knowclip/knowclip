import { addAndLoadFile } from './files'
import moment from 'moment'

// export const createProject = (
//   projectMetadata: ProjectMetadata
// ): CreateProject => ({
//   type: A.CREATE_PROJECT,
//   projectMetadata,
// })
export const createProject = (
  id: string,
  name: string,
  noteType: NoteType,
  filePath: string
) =>
  addAndLoadFile(
    {
      type: 'ProjectFile',
      id,
      name,
      noteType,
      mediaFiles: [],
      error: null,
      lastOpened: moment()
        .utc()
        .format(),
      lastSaved: moment()
        .utc()
        .format(),
    },
    filePath
  )

export const openProjectByFilePath = (filePath: string): Action => ({
  type: A.OPEN_PROJECT_REQUEST_BY_FILE_PATH,
  filePath,
})

export const openProjectById = (id: ProjectId): Action => ({
  type: A.OPEN_PROJECT_REQUEST_BY_ID,
  id,
})

export const openProject = (
  project: ProjectFileRecord,
  clips: Clip[]
): OpenProject => ({
  type: A.OPEN_PROJECT,
  project,
  clips,
})

export const removeProjectFromRecents = (id: ProjectId): Action => ({
  type: A.REMOVE_PROJECT_FROM_RECENTS,
  id,
})

export const closeProject = (): Action => ({
  type: A.CLOSE_PROJECT,
})

export const closeProjectRequest = (): Action => ({
  type: A.CLOSE_PROJECT_REQUEST,
})

export const setProjectName = (id: ProjectId, name: string): Action => ({
  type: A.SET_PROJECT_NAME,
  id,
  name,
})

export const addMediaToProjectRequest = (
  projectId: ProjectId,
  filePaths: Array<MediaFilePath>
) => ({
  type: A.ADD_MEDIA_TO_PROJECT_REQUEST,
  projectId,
  filePaths,
})

export const deleteMediaFromProjectRequest = (
  projectId: ProjectId,
  mediaFileId: MediaFileId
): Action => ({
  type: A.DELETE_MEDIA_FROM_PROJECT_REQUEST,
  projectId,
  mediaFileId,
})

export const deleteMediaFromProject = (
  projectId: ProjectId,
  mediaFileId: MediaFileId
): Action => ({
  type: A.DELETE_MEDIA_FROM_PROJECT,
  projectId,
  mediaFileId,
})

export const saveProjectRequest = (): Action => ({
  type: A.SAVE_PROJECT_REQUEST,
})

export const saveProjectAsRequest = (): Action => ({
  type: A.SAVE_PROJECT_AS_REQUEST,
})

export const setWorkIsUnsaved = (workIsUnsaved: boolean): Action => ({
  type: A.SET_WORK_IS_UNSAVED,
  workIsUnsaved,
})
