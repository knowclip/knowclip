export const addAndOpenFile = <F extends FileMetadata>(
  file: F,
  filePath?: FilePath
): AddAndOpenFile => ({
  type: A.ADD_AND_OPEN_FILE,
  file,
  filePath: filePath || null,
})

export const addFile = <F extends FileMetadata>(
  file: F,
  filePath?: FilePath // optional?
): AddFile => ({
  type: A.ADD_FILE,
  file,
  filePath: filePath || null,
})

export const deleteFileRequest = (file: FileMetadata): DeleteFileRequest => ({
  type: 'DELETE_FILE_REQUEST',
  file,
})
export const deleteFileSuccess = (file: FileMetadata): DeleteFileSuccess => ({
  type: 'DELETE_FILE_SUCCESS',
  file,
})
export const openFileRequest = (file: FileMetadata): OpenFileRequest => ({
  type: 'OPEN_FILE_REQUEST',
  file,
})
export const openFileSuccess = (
  file: FileMetadata,
  filePath: FilePath
): OpenFileSuccess => ({
  type: 'OPEN_FILE_SUCCESS',
  validatedFile: file,
  filePath,
})
export const openFileFailure = (
  file: FileMetadata,
  filePath: FilePath | null,
  errorMessage: string
): OpenFileFailure => ({
  type: 'OPEN_FILE_FAILURE',
  file,
  filePath,
  errorMessage,
})
export const locateFileRequest = (
  file: FileMetadata,
  message: string
): LocateFileRequest => ({
  type: 'LOCATE_FILE_REQUEST',
  file,
  message,
})
export const locateFileSuccess = (
  file: FileMetadata,
  filePath: FilePath
): LocateFileSuccess => ({
  type: 'LOCATE_FILE_SUCCESS',
  file,
  filePath,
})
