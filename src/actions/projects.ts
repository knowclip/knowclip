export const createProject = (
  projectMetadata: ProjectMetadata
): CreateProject => ({
  type: A.CREATE_PROJECT,
  projectMetadata,
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
  project: Project4_1_0,
  projectMetadata: ProjectMetadata
): OpenProject => ({
  type: A.OPEN_PROJECT,
  project,
  projectMetadata,
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

// export const addMediaToProject = (
//   projectId: ProjectId,
//   mediaFiles: Array<MediaFile>
// ): AddMediaToProject => ({
//   type: A.ADD_MEDIA_TO_PROJECT,
//   projectId,
//   mediaFiles,
// })

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

// export const openMediaFileRequest = (id: MediaFileId): Action => ({
//   type: A.OPEN_MEDIA_FILE_REQUEST,
//   id,
// })

// export const openMediaFileSuccess = (
//   filePath: MediaFilePath,
//   constantBitrateFilePath: MediaFilePath,
//   metadata: MediaFileMetadata
// ): OpenMediaFileSuccess => ({
//   type: A.OPEN_MEDIA_FILE_SUCCESS,
//   filePath,
//   constantBitrateFilePath,
//   metadata,
// })

// export const openMediaFileFailure = (
//   errorMessage: string
// ): OpenMediaFileFailure => ({
//   type: A.OPEN_MEDIA_FILE_FAILURE,
//   errorMessage,
// })

export const locateMediaFileRequest = (
  id: MediaFileId,
  filePath: MediaFilePath
): Action => ({
  type: A.LOCATE_MEDIA_FILE_REQUEST,
  id,
  filePath,
})

export const locateMediaFileSuccess = (
  id: MediaFileId,
  metadata: MediaFileMetadata,
  filePath: MediaFilePath
): Action => ({
  type: A.LOCATE_MEDIA_FILE_SUCCESS,
  id,
  metadata,
  filePath,
})

export const openMp3Request = (
  id: string,
  filePath: string
): OpenMp3Request => ({
  type: A.OPEN_MP3_REQUEST,
  id,
  filePath,
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
