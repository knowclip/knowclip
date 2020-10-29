import { nowUtcTimestamp } from '../utils/sideEffects'
import A from '../types/ActionType'
import { FileUpdates } from '../files/updates'

export const filesActions = {
  /** Add file to records without opening or doing anything with it */
  [A.addFile]: <F extends FileMetadata>(file: F, path?: string) => ({
    type: A.addFile,
    file,
    path,
  }),

  [A.deleteFileRequest]: (fileType: FileMetadata['type'], id: FileId) => ({
    type: A.deleteFileRequest,
    fileType,
    id,
  }),
  [A.deleteFileSuccess]: (
    file: FileAvailability,
    descendants: Array<FileAvailability>
  ) => ({
    type: A.deleteFileSuccess,
    file,
    descendants,
  }),
  /** Try to open a file, and add it to the state tree if it isn't there yet. */
  [A.openFileRequest]: (
    file: FileMetadata,
    filePath: FilePath | null = null
  ) => ({
    type: A.openFileRequest,
    file,
    filePath,
  }),
  [A.openFileSuccess]: (
    file: FileMetadata,
    filePath: FilePath,
    timestamp: string = nowUtcTimestamp()
  ) => ({
    type: A.openFileSuccess,
    validatedFile: file,
    filePath,
    timestamp,
  }),
  [A.openFileFailure]: (
    file: FileMetadata,
    filePath: FilePath | null,
    errorMessage: string | null
  ) => ({
    type: A.openFileFailure,
    file,
    filePath,
    errorMessage,
  }),
  /** Should only be dispatched with a stored file */
  [A.locateFileRequest]: (
    /** This file should exist in the state already */
    file: FileMetadata,
    message: string
  ) => ({
    type: A.locateFileRequest,
    file,
    message,
  }),
  [A.locateFileSuccess]: (file: FileMetadata, filePath: FilePath) => ({
    type: A.locateFileSuccess,
    file,
    filePath,
  }),

  [A.commitFileDeletions]: (fileType?: FileMetadata['type']) => ({
    type: A.commitFileDeletions,
    fileType,
  }),

  [A.abortFileDeletions]: () => ({
    type: A.abortFileDeletions,
  }),

  [A.updateFile]: <U extends keyof FileUpdates>(update: FileUpdate<U>) => ({
    type: A.updateFile,
    update: update as FileUpdate<any>,
  }),

  [A.preloadVideoStills]: (file: FileMetadata, clipId: ClipId) => ({
    type: A.preloadVideoStills,
    clipId,
    file,
  }),
}
