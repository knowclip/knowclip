export const addAndLoadFile = <F extends FileMetadata>(
  file: F,
  filePath?: FilePath
): AddAndLoadFile => ({
  type: A.ADD_AND_LOAD_FILE,
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
  type: 'DELETE_FILE_RECORD_REQUEST',
  file,
})
export const deleteFileSuccess = (file: FileMetadata): DeleteFileSuccess => ({
  type: 'DELETE_FILE_RECORD_SUCCESS',
  file,
})
export const loadFileRequest = (file: FileMetadata): LoadFileRequest => ({
  type: 'LOAD_FILE_REQUEST',
  file,
})
export const loadFileSuccess = (
  file: FileMetadata,
  filePath: FilePath
): LoadFileSuccess => ({
  type: 'LOAD_FILE_SUCCESS',
  validatedFile: file,
  filePath,
})
export const loadFileFailure = (
  file: FileMetadata,
  filePath: FilePath | null,
  errorMessage: string
): LoadFileFailure => ({
  type: 'LOAD_FILE_FAILURE',
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
