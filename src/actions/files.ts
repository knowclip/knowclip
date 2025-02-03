import A from '../types/ActionType'
import { KnowclipActionCreatorsSubset } from '.'

export const filesActions = {
  /** Add file to records without opening or doing anything with it */
  addFile: <F extends FileMetadata>(file: F, path?: string) => ({
    type: A.addFile,
    file,
    path,
  }),

  deleteFileRequest: (fileType: FileMetadata['type'], id: FileId) => ({
    type: A.deleteFileRequest,
    fileType,
    id,
  }),
  deleteFileSuccess: (
    file: FileAvailability,
    descendants: Array<FileAvailability>
  ) => ({
    type: A.deleteFileSuccess,
    file,
    descendants,
  }),
  deleteFileFailure: (file: FileAvailability, errorMessage: string) => ({
    type: A.deleteFileFailure,
    file,
    errorMessage,
  }),
  /** Try to open a file, and add it to the state tree if it isn't there yet. */
  openFileRequest: (file: FileMetadata, filePath: FilePath | null = null) => ({
    type: A.openFileRequest,
    file,
    filePath,
  }),
  openFileSuccess: (
    file: FileMetadata,
    filePath: FilePath,
    timestamp: string
  ) => ({
    type: A.openFileSuccess,
    validatedFile: file,
    filePath,
    timestamp,
  }),
  openFileFailure: (
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
  locateFileRequest: (
    /** This file should exist in the state already */
    file: FileMetadata,
    message: string
  ) => ({
    type: A.locateFileRequest,
    file,
    message,
  }),
  locateFileSuccess: (file: FileMetadata, filePath: FilePath) => ({
    type: A.locateFileSuccess,
    file,
    filePath,
  }),

  commitFileDeletions: (fileType?: FileMetadata['type']) => ({
    type: A.commitFileDeletions,
    fileType,
  }),

  abortFileDeletions: () => ({
    type: A.abortFileDeletions,
  }),

  updateFile: <U extends FileUpdateName>(update: FileUpdate<U>) => ({
    type: A.updateFile,
    update,
  }),

  preloadVideoStills: (file: FileMetadata, clipId: ClipId) => ({
    type: A.preloadVideoStills,
    clipId,
    file,
  }),
} satisfies KnowclipActionCreatorsSubset
