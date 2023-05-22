import ActionType from '../types/ActionType'
import { clipsActions, compositeClipsActions } from './clips'
import { waveformActions } from './waveform'
import { snackbarActions, compositeSnackbarActions } from './snackbar'
import { dialogActions, compositeDialogActions } from './dialog'
import { projectActions, compositeProjectActions } from './projects'
import { subtitlesActions, compositeSubtitlesActions } from './subtitles'
import { filesActions } from './files'
import {
  dictionariesActions,
  compositeDictionariesActions,
} from './dictionaries'
import { sessionActions } from './session'
import { settingsActions } from './settings'
import { defineActionCreators } from './defineActionCreators'

type EnumKeys<T> = T extends Record<string, infer U> ? U : never
type ReverseEnum<T extends Record<string, string>> = {
  [K in EnumKeys<T>]: {
    [P in keyof T]: T[P] extends K ? P : never
  }[keyof T]
}

export type ActionCreatorNameOf<T extends ActionType> = ReverseEnum<
  typeof ActionType
>[T]
type ActionCreatorOf<T extends ActionType> =
  (typeof baseActions)[ActionCreatorNameOf<T>]

export type ActionOf<T extends ActionType> = ReturnType<ActionCreatorOf<T>>
export type Action = ActionOf<ActionType>

const appActions = defineActionCreators({
  initializeApp: () => ({
    type: ActionType.initializeApp,
  }),

  undo: () => ({
    type: ActionType.undo,
  }),

  redo: () => ({
    type: ActionType.redo,
  }),

  // [A['@@INIT']]: () => ({
  //   type: A['@@INIT']
  // }),

  setProjectError: (error: string | null) => ({
    type: ActionType.setProjectError,
    error,
  }),

  quitApp: () => ({
    type: ActionType.quitApp,
  }),

  setCurrentFile: (index: number) => ({
    type: ActionType.setCurrentFile,
    index,
  }),

  exportApkgRequest: (
    mediaFileIdsToClipIds: ReviewAndExportDialogData['mediaFileIdsToClipIds'],
    mediaOpenPrior: MediaFile | null
  ) => ({
    type: ActionType.exportApkgRequest,
    mediaFileIdsToClipIds,
    mediaOpenPrior,
  }),

  exportApkgFailure: (errorMessage?: string) => ({
    type: ActionType.exportApkgFailure,
    errorMessage: errorMessage || null,
  }),

  exportApkgSuccess: (successMessage: string) => ({
    type: ActionType.exportApkgSuccess,
    successMessage,
  }),

  exportCsv: (
    mediaFileIdsToClipIds: Record<string, (string | undefined)[]>,
    csvFilePath: string,
    mediaFolderLocation: string,
    rememberLocation: boolean
  ) => ({
    type: ActionType.exportCsv,
    mediaFileIdsToClipIds,
    csvFilePath,
    mediaFolderLocation,
    rememberLocation,
  }),

  exportMarkdown: (
    mediaFileIdsToClipIds: Record<MediaFileId, Array<ClipId | undefined>>
  ) => ({
    type: ActionType.exportMarkdown,
    mediaFileIdsToClipIds,
  }),

  detectSilenceRequest: () => ({
    type: ActionType.detectSilenceRequest,
  }),
  detectSilence: () => ({
    type: ActionType.detectSilence,
  }),

  deleteAllCurrentFileClipsRequest: () => ({
    type: ActionType.deleteAllCurrentFileClipsRequest,
  }),

  setAllTags: (tagsToClipIds: { [tag: string]: Array<ClipId> }) => ({
    type: ActionType.setAllTags,
    tagsToClipIds,
  }),

  setDefaultClipSpecs: ({
    tags,
    includeStill,
  }: {
    tags?: string[]
    includeStill?: boolean
  }) => ({
    type: ActionType.setDefaultClipSpecs,
    tags,
    includeStill,
  }),

  setProgress: (progress: ProgressInfo | null) => ({
    type: ActionType.setProgress,
    progress,
  }),

  startEditingCards: () => ({
    type: ActionType.startEditingCards,
  }),

  stopEditingCards: () => ({
    type: ActionType.stopEditingCards,
  }),

  openDictionaryPopover: () => ({
    type: ActionType.openDictionaryPopover,
  }),

  closeDictionaryPopover: () => ({
    type: ActionType.closeDictionaryPopover,
  }),

  newCardFromSubtitlesRequest: (
    linkedSubtitlesChunkSelection: WaveformSelection & {
      type: 'Preview'
    },
    clozeDeletion?: ClozeDeletion,
    startEditing: boolean = false
  ) => ({
    type: ActionType.newCardFromSubtitlesRequest,
    linkedSubtitlesChunkSelection,
    clozeDeletion,
    startEditing,
  }),
})

const baseActions = {
  ...appActions,
  ...clipsActions,
  ...waveformActions,
  ...snackbarActions,
  ...projectActions,
  ...dialogActions,
  ...subtitlesActions,
  ...filesActions,
  ...dictionariesActions,
  ...sessionActions,
  ...settingsActions,
}
const compositeActions = {
  ...compositeClipsActions,
  ...compositeSnackbarActions,
  ...compositeDialogActions,
  ...compositeProjectActions,
  ...compositeSubtitlesActions,
  ...compositeDictionariesActions,
}

export const actions = validateActionTypes({
  ...baseActions,
  ...compositeActions,
})

/** ensure no unused action types */
function validateActionTypes<
  ActionCreators extends {
    [N in ActionCreatorNameOf<ActionType>]: (
      ...args: any[]
    ) => ActionOf<ActionCreatorNamesToTypes[N]>
  },
  ActionCreatorNamesToTypes extends typeof ActionType
>(actions: ActionCreators): ActionCreators {
  return actions
}
