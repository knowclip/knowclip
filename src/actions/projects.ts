import * as A from '../types/ActionType'

export const createProject = (
  id: string,
  name: string,
  noteType: NoteType,
  filePath: string,
  now: string
): CreateProject => ({
  type: 'CREATE_PROJECT',
  project: {
    type: 'ProjectFile',
    id,
    name,
    noteType,
    mediaFileIds: [],
    error: null,
    createdAt: now,
    lastSaved: now,
  },
  filePath,
})
export const openProjectByFilePath = (filePath: string): Action => ({
  type: A.OPEN_PROJECT_REQUEST_BY_FILE_PATH,
  filePath,
})

export const openProjectById = (id: ProjectId): Action => ({
  type: A.OPEN_PROJECT_REQUEST_BY_ID,
  id,
})

export const openProject = (
  project: ProjectFile,
  clips: Clip[],
  now: string,
  flashcards: FlashcardsState
): OpenProject => ({
  type: A.OPEN_PROJECT,
  project,
  clips,
  flashcards,
  now,
})

export const closeProject = (): Action => ({
  type: A.CLOSE_PROJECT,
})

export const closeProjectRequest = (): Action => ({
  type: A.CLOSE_PROJECT_REQUEST,
})

export const setProjectName = (
  id: ProjectId,
  name: string
): UpdateFileWith<'setProjectName'> => ({
  type: A.UPDATE_FILE,
  update: {
    id,
    updateName: 'setProjectName',
    updatePayload: [name],
  },
})

export const addMediaToProjectRequest = (
  projectId: ProjectId,
  filePaths: Array<MediaFilePath>
) => ({
  type: A.ADD_MEDIA_TO_PROJECT_REQUEST,
  projectId,
  filePaths,
})

export const deleteMediaFromProject = (
  projectId: ProjectId,
  mediaFileId: MediaFileId
): UpdateFileWith<'deleteProjectMedia'> => ({
  type: A.UPDATE_FILE,
  update: {
    updateName: 'deleteProjectMedia',
    id: projectId,
    updatePayload: [mediaFileId],
  },
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
