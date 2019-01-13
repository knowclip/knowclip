// @flow

export * from './waveform'
export * from './snackbar'
export * from './dialog'
export * from './noteTypes'

export const initializeApp = (): AppAction => ({ type: 'INITIALIZE_APP' })

export const chooseAudioFiles = (
  filePaths: Array<AudioFilePath>,
  noteTypeId: NoteTypeId
): AppAction => ({
  type: 'CHOOSE_AUDIO_FILES',
  filePaths,
  noteTypeId,
})

export const removeAudioFiles = (): AppAction => ({
  type: 'REMOVE_AUDIO_FILES',
})

export const setFlashcardField = (
  id: ClipId,
  key: string,
  value: string
): AppAction => ({
  type: 'SET_FLASHCARD_FIELD',
  id,
  key,
  value,
})

export const loadAudio = (
  filePath: string,
  audioElement: Object,
  svgElement: Object
): AppAction => ({
  type: 'LOAD_AUDIO',
  filePath,
  audioElement,
  svgElement,
})

export const setCurrentFile = (index: number): AppAction => ({
  type: 'SET_CURRENT_FILE',
  index,
})

export const toggleLoop = (): AppAction => ({
  type: 'TOGGLE_LOOP',
})

export const loadAudioSuccess = (file: Object): AppAction => ({
  type: 'LOAD_AUDIO_SUCCESS',
  file,
})

export const deleteCard = (id: ClipId): AppAction => ({
  type: 'DELETE_CARD',
  id,
})

export const deleteCards = (ids: Array<ClipId>): AppAction => ({
  type: 'DELETE_CARDS',
  ids,
})

export const makeClips = (): AppAction => ({
  type: 'MAKE_CLIPS',
})

export const exportFlashcards = (): AppAction => ({ type: 'EXPORT_FLASHCARDS' })

export const setMediaFolderLocation = (directoryPath: string): AppAction => ({
  type: 'SET_MEDIA_FOLDER_LOCATION',
  directoryPath,
})

export const detectSilenceRequest = (): AppAction => ({
  type: 'DETECT_SILENCE_REQUEST',
})
export const detectSilence = (): AppAction => ({ type: 'DETECT_SILENCE' })

export const deleteAllCurrentFileClipsRequest = (): AppAction => ({
  type: 'DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST',
})
