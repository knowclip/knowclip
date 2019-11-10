export const addFile = <F extends FileRecord>(
  fileRecord: F,
  filePath?: FilePath
): AddFileWith<F> => ({
  type: A.ADD_FILE,
  fileRecord,
  filePath: filePath || null,
})

// export const AddFileSuccess = <F extends FileRecord>(
//   fileRecord: F,
//   filePath: FilePath
// ): AddFileSuccessWith<F> => ({
//   type: A.ADD_FILE_SUCCESS,
//   fileRecord,
//   filePath,
// })
// export const AddFileFailure = <F extends FileRecord>(
//   fileRecord: F,
//   filePath: FilePath
// ): AddFileFailureWith<F> => ({
//   type: A.ADD_FILE_FAILURE,
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
  fileRecord: FileRecord
): LocateFileRequest => ({
  type: 'LOCATE_FILE_REQUEST',
  fileRecord,
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
