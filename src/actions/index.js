// @flow
import type { SnackbarAction } from './snackbar'
import type { DialogAction } from './dialog'
import type { WaveformAction } from './waveform'

export * from './waveform'
export * from './snackbar'
export * from './dialog'

export type AppAction =
  | SnackbarAction
  | DialogAction
  | WaveformAction
  | {| type: 'CHOOSE_AUDIO_FILES', filePaths: Array<AudioFilePath> |}
  | {|
      type: 'SET_FLASHCARD_FIELD',
      id: FlashcardId,
      key: string,
      value: string,
    |}
  | {|
      type: 'LOAD_AUDIO',
      filePath: string,
      audioElement: Object,
      svgElement: Object,
    |}
  | {| type: 'SET_CURRENT_FILE', index: number |}
  | {| type: 'TOGGLE_LOOP' |}
  | {| type: 'LOAD_AUDIO_SUCCESS', file: Object |}
  | {| type: 'DELETE_CARD', id: FlashcardId |}
  | {| type: 'MAKE_CLIPS' |}
  | {| type: 'EXPORT_FLASHCARDS' |}
  | {| type: 'INITIALIZE_APP' |}
  | {| type: 'SET_MEDIA_FOLDER_LOCATION', directoryPath: ?string |}
  | {| type: 'DETECT_SILENCE' |}
  | {| type: 'DETECT_SILENCE_REQUEST' |}
  | {| type: 'DELETE_CARDS', ids: Array<FlashcardId> |}
  | {| type: 'DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST' |}

export const initializeApp = (): AppAction => ({ type: 'INITIALIZE_APP' })

export const chooseAudioFiles = (
  filePaths: Array<AudioFilePath>
): AppAction => ({
  type: 'CHOOSE_AUDIO_FILES',
  filePaths,
})

export const setFlashcardField = (
  id: FlashcardId,
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

export const deleteCard = (id: FlashcardId): AppAction => ({
  type: 'DELETE_CARD',
  id,
})

export const deleteCards = (ids: Array<FlashcardId>): AppAction => ({
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
