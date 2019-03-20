// @flow

export * from './clips'
export * from './waveform'
export * from './snackbar'
export * from './dialog'
export * from './noteTypes'
export * from './projects'

export const initializeApp = (): Action => ({ type: 'INITIALIZE_APP' })

export const chooseAudioFiles = (
  filePaths: Array<AudioFilePath>,
  ids: Array<AudioFileId>,
  noteTypeId: NoteTypeId
): Action => ({
  type: 'CHOOSE_AUDIO_FILES',
  filePaths,
  ids,
  noteTypeId,
})

export const removeAudioFiles = (): Action => ({
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

export const setFlashcardTagsText = (id: ClipId, value: string): Action => ({
  type: 'SET_FLASHCARD_TAGS_TEXT',
  id,
  value,
})

export const addFlashcardTag = (id: ClipId, text: string): Action => ({
  type: 'ADD_FLASHCARD_TAG',
  id,
  text,
})

export const deleteFlashcardTag = (id: ClipId, index: number): Action => ({
  type: 'DELETE_FLASHCARD_TAG',
  id,
  index,
})

export const loadAudio = (
  filePath: string,
  audioElement: Object,
  svgElement: Object
): Action => ({
  type: 'LOAD_AUDIO',
  filePath,
  audioElement,
  svgElement,
})

export const setCurrentFile = (index: number): Action => ({
  type: 'SET_CURRENT_FILE',
  index,
})

export const toggleLoop = (): Action => ({
  type: 'TOGGLE_LOOP',
})

export const loadAudioSuccess = (file: Object): Action => ({
  type: 'LOAD_AUDIO_SUCCESS',
  file,
})

export const deleteCard = (id: ClipId): Action => ({
  type: 'DELETE_CARD',
  id,
})

export const deleteCards = (ids: Array<ClipId>): Action => ({
  type: 'DELETE_CARDS',
  ids,
})

export const makeClips = (format: ExportFormat): Action => ({
  type: 'MAKE_CLIPS',
  format,
})

export const exportFlashcards = (): Action => ({ type: 'EXPORT_FLASHCARDS' })

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

export const hydrateFromProjectFile = (state: $Shape<AppState>): Action => ({
  type: 'HYDRATE_FROM_PROJECT_FILE',
  state,
})
