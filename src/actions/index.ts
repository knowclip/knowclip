export * from './clips'
export * from './waveform'
export * from './snackbar'
export * from './dialog'
export * from './projects'
export * from './subtitles'
export * from './files'
export * from './user'

export const initializeApp = (): Action => ({
  type: A.INITIALIZE_APP,
})

export const loadPersistedState = (
  files: FilesState | null,
  fileAvailabilities: FileAvailabilitiesState | null
): LoadPersistedState => ({
  type: A.LOAD_PERSISTED_STATE,
  files,
  fileAvailabilities,
})

export const setFlashcardField = (
  id: ClipId,
  key: FlashcardFieldName,
  value: string
): SetFlashcardField => ({
  type: A.SET_FLASHCARD_FIELD,
  id,
  key,
  value,
})

export const addFlashcardTag = (id: ClipId, text: string): Action => ({
  type: A.ADD_FLASHCARD_TAG,
  id,
  text,
})

export const deleteFlashcardTag = (
  id: ClipId,
  index: number,
  tag: string
): Action => ({
  type: A.DELETE_FLASHCARD_TAG,
  id,
  index,
  tag,
})

export const setCurrentFile = (index: number): Action => ({
  type: A.SET_CURRENT_FILE,
  index,
})

export const toggleLoop = (): Action => ({
  type: A.TOGGLE_LOOP,
})

export const setLoop = (loop: boolean): Action => ({
  type: A.SET_LOOP,
  loop,
})

export const deleteCard = (id: ClipId): Action => ({
  type: A.DELETE_CARD,
  id,
})

export const deleteCards = (ids: Array<ClipId>): DeleteCards => ({
  type: A.DELETE_CARDS,
  ids,
})

export const exportApkgRequest = (
  clipIds: Array<ClipId>,
  mediaOpenPrior: MediaFile | null
): ExportApkgRequest => ({
  type: A.EXPORT_APKG_REQUEST,
  clipIds,
  mediaOpenPrior,
})

export const exportApkgFailure = (errorMessage?: string): Action => ({
  type: A.EXPORT_APKG_FAILURE,
  errorMessage: errorMessage || null,
})

export const exportApkgSuccess = (successMessage: string): Action => ({
  type: A.EXPORT_APKG_SUCCESS,
  successMessage,
})

export const exportMp3 = (exportData: ApkgExportData): Action => ({
  type: A.EXPORT_MP3,
  exportData,
})

export const exportCsv = (
  clipIds: Array<ClipId>,
  csvFilePath: string,
  mediaFolderLocation: string
): Action => ({
  type: A.EXPORT_CSV,
  clipIds,
  csvFilePath,
  mediaFolderLocation,
})

export const exportMarkdown = (clipIds: Array<ClipId>): Action => ({
  type: A.EXPORT_MARKDOWN,
  clipIds,
})

export const setMediaFolderLocation = (directoryPath: string): Action => ({
  type: A.SET_MEDIA_FOLDER_LOCATION,
  directoryPath,
})

export const detectSilenceRequest = (): Action => ({
  type: A.DETECT_SILENCE_REQUEST,
})
export const detectSilence = (): Action => ({
  type: A.DETECT_SILENCE,
})

export const deleteAllCurrentFileClipsRequest = (): DeleteAllCurrentFileClipsRequest => ({
  type: A.DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST,
})

export const setAllTags = (tagsToClipIds: {
  [tag: string]: Array<ClipId>
}): SetAllTags => ({
  type: A.SET_ALL_TAGS,
  tagsToClipIds,
})

export const setDefaultTags = (tags: string[]): SetDefaultTags => ({
  type: 'SET_DEFAULT_TAGS',
  tags,
})

export const setProgress = (progress: ProgressInfo | null): SetProgress => ({
  type: 'SET_PROGRESS',
  progress,
})
