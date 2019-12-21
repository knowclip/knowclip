export const addAndLoadFile = <F extends FileRecord>(
  fileRecord: F,
  filePath?: FilePath
): AddAndLoadFile => ({
  type: A.ADD_AND_LOAD_FILE,
  fileRecord,
  filePath: filePath || null,
})

export const addFile = <F extends FileRecord>(
  fileRecord: F,
  filePath?: FilePath // optional?
): AddFile => ({
  type: A.ADD_FILE,
  fileRecord,
  filePath: filePath || null,
})

export const deleteFileRecordRequest = (
  fileRecord: FileRecord
): DeleteFileRecordRequest => ({
  type: 'DELETE_FILE_RECORD_REQUEST',
  fileRecord,
})
export const deleteFileRecordSuccess = (
  fileRecord: FileRecord
): DeleteFileRecordSuccess => ({
  type: 'DELETE_FILE_RECORD_SUCCESS',
  fileRecord,
})
export const loadFileRequest = (fileRecord: FileRecord): LoadFileRequest => ({
  type: 'LOAD_FILE_REQUEST',
  fileRecord,
})
export const loadFileSuccess = (
  fileRecord: FileRecord,
  filePath: FilePath
): LoadFileSuccess => ({
  type: 'LOAD_FILE_SUCCESS',
  validatedFileRecord: fileRecord,
  filePath,
})
export const loadFileFailure = (
  fileRecord: FileRecord,
  filePath: FilePath | null,
  errorMessage: string
): LoadFileFailure => ({
  type: 'LOAD_FILE_FAILURE',
  fileRecord,
  filePath,
  errorMessage,
})
export const locateFileRequest = (
  fileRecord: FileRecord,
  message: string,
): LocateFileRequest => ({
  type: 'LOCATE_FILE_REQUEST',
  fileRecord,
  message,
})
export const locateFileSuccess = (
  fileRecord: FileRecord,
  filePath: FilePath
): LocateFileSuccess => ({
  type: 'LOCATE_FILE_SUCCESS',
  fileRecord,
  filePath,
})
