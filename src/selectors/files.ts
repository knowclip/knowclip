export const getPreviouslyLoadedFile = (
  state: AppState,
  fileRecord: FileRecord
): LoadedFile | null => state.loadedFiles[fileRecord.id]
