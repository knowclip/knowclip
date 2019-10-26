export const createFileRecord = <F extends FileRecord>(
  fileRecord: F,
  filePath: FilePath | null
): CreateFileRecordWith<F> => ({
  type: A.CREATE_FILE_RECORD,
  fileRecord,
  filePath,
})

// export const createFileRecordSuccess = <F extends FileRecord>(
//   fileRecord: F,
//   filePath: FilePath
// ): CreateFileRecordSuccessWith<F> => ({
//   type: A.CREATE_FILE_RECORD_SUCCESS,
//   fileRecord,
//   filePath,
// })
// export const createFileRecordFailure = <F extends FileRecord>(
//   fileRecord: F,
//   filePath: FilePath
// ): CreateFileRecordFailureWith<F> => ({
//   type: A.CREATE_FILE_RECORD_FAILURE,
//   fileRecord,
//   filePath,
// })

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
  fileRecord,
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
  filePath: FilePath
): LocateFileRequest => ({
  type: 'LOCATE_FILE_REQUEST',
  fileRecord,
  filePath,
})
export const locateFileSuccess = (
  fileRecord: FileRecord,
  filePath: FilePath
): LocateFileSuccess => ({
  type: 'LOCATE_FILE_SUCCESS',
  fileRecord,
  filePath,
})
export const locateFileFailure = (
  fileRecord: FileRecord,
  errorMessage: string
): LocateFileFailure => ({
  // needed?
  type: 'LOCATE_FILE_FAILURE',
  fileRecord,
  errorMessage,
})
