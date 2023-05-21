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

type EnumKeys<T> = T extends Record<string, infer U> ? U : never
type ReverseEnum<T extends Record<string, string>> = {
  [K in EnumKeys<T>]: {
    [P in keyof T]: T[P] extends K ? P : never
  }[keyof T]
}

type ActionCreatorNameOf<T extends ActionType> = ReverseEnum<
  typeof ActionType
>[T]
type ActionCreatorOf<T extends ActionType> =
  (typeof baseActions)[ActionCreatorNameOf<T>]

export type ActionOf<T extends ActionType> = ReturnType<ActionCreatorOf<T>>
export type Action = ActionOf<ActionType>

const appActions = {
  initializeApp: () => ({
    type: ActionType.initializeApp as const,
  }),

  undo: () => ({
    type: ActionType.undo as const,
  }),

  redo: () => ({
    type: ActionType.redo as const,
  }),

  // [A['@@INIT']]: () => ({
  //   type: A['@@INIT']
  // }),

  setProjectError: (error: string | null) => ({
    type: ActionType.setProjectError as const,
    error,
  }),

  quitApp: () => ({
    type: ActionType.quitApp as const,
  }),

  setCurrentFile: (index: number) => ({
    type: ActionType.setCurrentFile as const,
    index,
  }),

  exportApkgRequest: (
    mediaFileIdsToClipIds: ReviewAndExportDialogData['mediaFileIdsToClipIds'],
    mediaOpenPrior: MediaFile | null
  ) => ({
    type: ActionType.exportApkgRequest as const,
    mediaFileIdsToClipIds,
    mediaOpenPrior,
  }),

  exportApkgFailure: (errorMessage?: string) => ({
    type: ActionType.exportApkgFailure as const,
    errorMessage: errorMessage || null,
  }),

  exportApkgSuccess: (successMessage: string) => ({
    type: ActionType.exportApkgSuccess as const,
    successMessage,
  }),

  exportCsv: (
    mediaFileIdsToClipIds: Record<string, (string | undefined)[]>,
    csvFilePath: string,
    mediaFolderLocation: string,
    rememberLocation: boolean
  ) => ({
    type: ActionType.exportCsv as const,
    mediaFileIdsToClipIds,
    csvFilePath,
    mediaFolderLocation,
    rememberLocation,
  }),

  exportMarkdown: (
    mediaFileIdsToClipIds: Record<MediaFileId, Array<ClipId | undefined>>
  ) => ({
    type: ActionType.exportMarkdown as const,
    mediaFileIdsToClipIds,
  }),

  detectSilenceRequest: () => ({
    type: ActionType.detectSilenceRequest as const,
  }),
  detectSilence: () => ({
    type: ActionType.detectSilence as const,
  }),

  deleteAllCurrentFileClipsRequest: () => ({
    type: ActionType.deleteAllCurrentFileClipsRequest as const,
  }),

  setAllTags: (tagsToClipIds: { [tag: string]: Array<ClipId> }) => ({
    type: ActionType.setAllTags as const,
    tagsToClipIds,
  }),

  setDefaultClipSpecs: ({
    tags,
    includeStill,
  }: {
    tags?: string[]
    includeStill?: boolean
  }) => ({
    type: ActionType.setDefaultClipSpecs as const,
    tags,
    includeStill,
  }),

  setProgress: (progress: ProgressInfo | null) => ({
    type: ActionType.setProgress as const,
    progress,
  }),

  startEditingCards: () => ({
    type: ActionType.startEditingCards as const,
  }),

  stopEditingCards: () => ({
    type: ActionType.stopEditingCards as const,
  }),

  openDictionaryPopover: () => ({
    type: ActionType.openDictionaryPopover as const,
  }),

  closeDictionaryPopover: () => ({
    type: ActionType.closeDictionaryPopover as const,
  }),

  newCardFromSubtitlesRequest: (
    linkedSubtitlesChunkSelection: WaveformSelection & {
      type: 'Preview'
    },
    clozeDeletion?: ClozeDeletion,
    startEditing: boolean = false
  ) => ({
    type: ActionType.newCardFromSubtitlesRequest as const,
    linkedSubtitlesChunkSelection,
    clozeDeletion,
    startEditing,
  }),
}

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
} as const
const compositeActions = {
  ...compositeClipsActions,
  ...compositeSnackbarActions,
  ...compositeDialogActions,
  ...compositeProjectActions,
  ...compositeSubtitlesActions,
  ...compositeDictionariesActions,
}

export const actions = {
  ...baseActions,
  ...compositeActions,
}

type ActionCreatorNamesToTypes = typeof ActionType

type ActionCreators = {
  [N in ActionCreatorNameOf<ActionType>]: (
    ...args: any[]
  ) => ActionOf<ActionCreatorNamesToTypes[N]>
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _validateActions: ActionCreators = actions
/* eslint-enable @typescript-eslint/no-unused-vars */
