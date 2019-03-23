// @flow

export const createProject = (
  projectMetadata: ProjectMetadata,
  noteType: NoteType
): Action => ({
  type: 'CREATE_PROJECT',
  projectMetadata,
  noteType,
})

export const openProjectByFilePath = (filePath: string): Action => ({
  type: 'OPEN_PROJECT_REQUEST_BY_FILE_PATH',
  filePath,
})

export const openProjectById = (id: ProjectId): Action => ({
  type: 'OPEN_PROJECT_REQUEST_BY_ID',
  id,
})

export const openProject = (
  project: Project2_0_0,
  projectMetadata: ProjectMetadata
): Action => ({
  type: 'OPEN_PROJECT',
  project,
  projectMetadata,
})

export const removeProjectFromRecents = (id: ProjectId): Action => ({
  type: 'REMOVE_PROJECT_FROM_RECENTS',
  id,
})

export const openMediaFileRequest = (id: AudioFileId): Action => ({
  type: 'OPEN_MEDIA_FILE_REQUEST',
  id,
})

export const openMediaFileSuccess = (filePath: AudioFilePath): Action => ({
  type: 'OPEN_MEDIA_FILE_SUCCESS',
  filePath,
})

export const closeProject = (): Action => ({
  type: 'CLOSE_PROJECT',
})

export const setProjectName = (id: ProjectId, name: string): Action => ({
  type: 'SET_PROJECT_NAME',
  id,
  name,
})
