export const getPreviouslyLoadedFile = (
  state: AppState,
  fileRecord: FileRecord
): LoadedFile | null => state.loadedFiles[fileRecord.type][fileRecord.id]

export const getFileRecord = <F extends FileRecord>(
  state: AppState,
  type: F['type'],
  id: FileId
): F | null => (state.fileRecords[type][id] as F) || null
