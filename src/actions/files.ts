import { nowUtcTimestamp } from '../utils/sideEffects'
import * as A from '../types/ActionType'

export const addFile = <F extends FileMetadata>(
  file: F,
  path?: string
): AddFile => ({
  type: A.ADD_FILE,
  file,
  path,
})

export const deleteFileRequest = (
  fileType: FileMetadata['type'],
  id: FileId
): DeleteFileRequest => ({
  type: A.DELETE_FILE_REQUEST,
  fileType,
  id,
})
export const deleteFileSuccess = (
  file: FileAvailability,
  descendants: Array<FileAvailability>
): DeleteFileSuccess => ({
  type: A.DELETE_FILE_SUCCESS,
  file,
  descendants,
})
/** Try to open a file, and add it to the state tree if it isn't there yet. */
export const openFileRequest = (
  file: FileMetadata,
  filePath: FilePath | null = null
): OpenFileRequest => ({
  type: A.OPEN_FILE_REQUEST,
  file,
  filePath,
})
export const openFileSuccess = (
  file: FileMetadata,
  filePath: FilePath,
  timestamp: string = nowUtcTimestamp()
): OpenFileSuccess => ({
  type: A.OPEN_FILE_SUCCESS,
  validatedFile: file,
  filePath,
  timestamp,
})
export const openFileFailure = (
  file: FileMetadata,
  filePath: FilePath | null,
  errorMessage: string | null
): OpenFileFailure => ({
  type: A.OPEN_FILE_FAILURE,
  file,
  filePath,
  errorMessage,
})
export const locateFileRequest = (
  file: FileMetadata,
  message: string
): LocateFileRequest => ({
  type: A.LOCATE_FILE_REQUEST,
  file,
  message,
})
export const locateFileSuccess = (
  file: FileMetadata,
  filePath: FilePath
): LocateFileSuccess => ({
  type: A.LOCATE_FILE_SUCCESS,
  file,
  filePath,
})

export const commitFileDeletions = (): CommitFileDeletions => ({
  type: A.COMMIT_FILE_DELETIONS,
})

export const abortFileDeletions = (): AbortFileDeletions => ({
  type: A.ABORT_FILE_DELETIONS,
})

export const preloadVideoStills = (
  file: FileMetadata,
  clipId: ClipId
): PreloadVideoStills => ({
  type: A.PRELOAD_VIDEO_STILLS,
  clipId,
  file,
})
