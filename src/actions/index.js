// @flow

export * from './clips'
export * from './waveform'
export * from './snackbar'
export * from './dialog'
export * from './projects'
export * from './subtitles'

export const initializeApp = (): Action => ({ type: 'INITIALIZE_APP' })

export const chooseMediaFiles = (
  filePaths: Array<MediaFilePath>,
  ids: Array<MediaFileId>,
  noteTypeId: NoteTypeId
): Action => ({
  type: 'CHOOSE_AUDIO_FILES',
  filePaths,
  ids,
  noteTypeId,
})

export const removeMediaFiles = (): Action => ({
  type: 'REMOVE_AUDIO_FILES',
})

export const setFlashcardField = (
  id: ClipId,
  key: string,
  value: string
): Action => ({
  type: 'SET_FLASHCARD_FIELD',
  id,
  key,
  value,
})

export const addFlashcardTag = (id: ClipId, text: string): Action => ({
  type: 'ADD_FLASHCARD_TAG',
  id,
  text,
})

export const deleteFlashcardTag = (
  id: ClipId,
  index: number,
  tag: string
): Action => ({
  type: 'DELETE_FLASHCARD_TAG',
  id,
  index,
  tag,
})

export const setCurrentFile = (index: number): Action => ({
  type: 'SET_CURRENT_FILE',
  index,
})

export const toggleLoop = (): Action => ({
  type: 'TOGGLE_LOOP',
})

export const setLoop = (loop: boolean): Action => ({
  type: 'SET_LOOP',
  loop,
})

export const deleteCard = (id: ClipId): Action => ({
  type: 'DELETE_CARD',
  id,
})

export const deleteCards = (ids: Array<ClipId>): Action => ({
  type: 'DELETE_CARDS',
  ids,
})

export const exportApkgRequest = (clipIds: Array<ClipId>): Action => ({
  type: 'EXPORT_APKG_REQUEST',
  clipIds,
})

export const exportApkgFailure = (errorMessage: ?string): Action => ({
  type: 'EXPORT_APKG_FAILURE',
  errorMessage,
})

export const exportApkgSuccess = (successMessage: string): Action => ({
  type: 'EXPORT_APKG_SUCCESS',
  successMessage,
})

export const exportMp3 = (exportData: ApkgExportData): Action => ({
  type: 'EXPORT_MP3',
  exportData,
})

export const exportCsv = (
  clipIds: Array<ClipId>,
  csvFilePath: string
): Action => ({
  type: 'EXPORT_CSV',
  clipIds,
  csvFilePath,
})

export const exportMarkdown = (clipIds: Array<ClipId>): Action => ({
  type: 'EXPORT_MARKDOWN',
  clipIds,
})

export const setMediaFolderLocation = (directoryPath: string): Action => ({
  type: 'SET_MEDIA_FOLDER_LOCATION',
  directoryPath,
})

export const detectSilenceRequest = (): Action => ({
  type: 'DETECT_SILENCE_REQUEST',
})
export const detectSilence = (): Action => ({ type: 'DETECT_SILENCE' })

export const deleteAllCurrentFileClipsRequest = (): Action => ({
  type: 'DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST',
})

export const setAllTags = (tagsToClipIds: {
  [string]: Array<ClipId>,
}): Action => ({
  type: 'SET_ALL_TAGS',
  tagsToClipIds,
})
