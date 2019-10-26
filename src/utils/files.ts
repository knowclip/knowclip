export const isAddFile = <F extends FileRecord>(fileRecordType: F['type']) => (
  action: Action
): action is AddFileWith<F> =>
  action.type === A.ADD_FILE && action.fileRecord.type === fileRecordType

export const isLoadFileRequest = <F extends FileRecord>(
  fileRecordType: F['type']
) => (action: Action): action is LoadFileRequestWith<F> =>
  action.type === A.LOAD_FILE_REQUEST &&
  action.fileRecord.type === fileRecordType

export const isLoadFileSuccess = <F extends FileRecord>(
  fileRecordType: F['type']
) => (action: Action): action is LoadFileSuccessWith<F> =>
  action.type === A.LOAD_FILE_SUCCESS &&
  action.fileRecord.type === fileRecordType

export const isLoadFileFailure = <F extends FileRecord>(
  fileRecordType: F['type']
) => (action: Action): action is LoadFileFailureWith<F> =>
  action.type === A.LOAD_FILE_FAILURE &&
  action.fileRecord.type === fileRecordType

export const isLocateFileRequest = <F extends FileRecord>(
  fileRecordType: F['type']
) => (action: Action): action is LocateFileRequest & { fileRecord: F } =>
  action.type === A.LOCATE_FILE_REQUEST &&
  action.fileRecord.type === fileRecordType
