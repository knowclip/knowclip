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

export const closeProject = (): Action => ({
  type: 'CLOSE_PROJECT',
})

export const setProjectName = (id: ProjectId, name: string): Action => ({
  type: 'SET_PROJECT_NAME',
  id,
  name,
})

export const addMediaToProjectRequest = (
  projectId: ProjectId,
  filePaths: Array<MediaFilePath>
): Action => ({
  type: 'ADD_MEDIA_TO_PROJECT_REQUEST',
  projectId,
  filePaths,
})

export const addMediaToProject = (
  projectId: ProjectId,
  mediaFilePaths: Array<AudioMetadataAndPath>
): Action => ({
  type: 'ADD_MEDIA_TO_PROJECT',
  projectId,
  mediaFilePaths,
})

export const deleteMedia = (
  projectId: ProjectId,
  mediaFileId: MediaFileId
): Action => ({
  type: 'DELETE_MEDIA_FROM_PROJECT',
  projectId,
  mediaFileId,
})

export const openMediaFileRequest = (id: MediaFileId): Action => ({
  type: 'OPEN_MEDIA_FILE_REQUEST',
  id,
})

export const openMediaFileSuccess = (
  filePath: MediaFilePath,
  constantBitrateFilePath: MediaFilePath,
  metadata: MediaFileMetadata,
  projectId: ProjectId // kind of unnecessary... maybe should change state shape
): Action => ({
  type: 'OPEN_MEDIA_FILE_SUCCESS',
  filePath,
  constantBitrateFilePath,
  metadata,
  projectId,
})

export const openMediaFileFailure = (errorMessage: string): Action => ({
  type: 'OPEN_MEDIA_FILE_FAILURE',
  errorMessage,
})

export const locateMediaFileRequest = (
  id: MediaFileId,
  filePath: MediaFilePath
): Action => ({ type: 'LOCATE_MEDIA_FILE_REQUEST', id, filePath })

export const locateMediaFileSuccess = (
  id: MediaFileId,
  metadata: MediaFileMetadata,
  projectId: ProjectId, // kind of unnecessary... maybe should change state shape
  filePath: MediaFilePath
): Action => ({
  type: 'LOCATE_MEDIA_FILE_SUCCESS',
  id,
  metadata,
  projectId,
  filePath,
})
