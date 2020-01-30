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

export const setCurrentFile = (index: number): Action => ({
  type: A.SET_CURRENT_FILE,
  index,
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

export const setDefaultClipSpecs = ({
  tags,
  includeStill,
}: {
  tags?: string[]
  includeStill?: boolean
}): SetDefaultClipSpecs => ({
  type: 'SET_DEFAULT_CLIP_SPECS',
  tags,
  includeStill,
})

export const setProgress = (progress: ProgressInfo | null): SetProgress => ({
  type: 'SET_PROGRESS',
  progress,
})
