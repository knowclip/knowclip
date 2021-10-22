import A from '../types/ActionType'

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

type ActionType = keyof typeof A
export type ActionOf<T extends ActionType> = ReturnType<
  typeof baseActions[T]
> extends { type: T }
  ? ReturnType<typeof baseActions[T]>
  : never
export type Action = ActionOf<ActionType>

const appActions = {
  initializeApp: () => ({
    type: A.initializeApp,
  }),

  undo: () => ({
    type: A.undo,
  }),

  redo: () => ({
    type: A.redo,
  }),

  // [A['@@INIT']]: () => ({
  //   type: A['@@INIT']
  // }),

  setProjectError: (error: string | null) => ({
    type: A.setProjectError,
    error,
  }),

  quitApp: () => ({
    type: A.quitApp,
  }),

  setCurrentFile: (index: number) => ({
    type: A.setCurrentFile,
    index,
  }),

  exportApkgRequest: (
    mediaFileIdsToClipIds: ReviewAndExportDialogData['mediaFileIdsToClipIds'],
    mediaOpenPrior: MediaFile | null
  ) => ({
    type: A.exportApkgRequest,
    mediaFileIdsToClipIds,
    mediaOpenPrior,
  }),

  exportApkgFailure: (errorMessage?: string) => ({
    type: A.exportApkgFailure,
    errorMessage: errorMessage || null,
  }),

  exportApkgSuccess: (successMessage: string) => ({
    type: A.exportApkgSuccess,
    successMessage,
  }),

  exportCsv: (
    mediaFileIdsToClipIds: Record<string, (string | undefined)[]>,
    csvFilePath: string,
    mediaFolderLocation: string,
    rememberLocation: boolean
  ) => ({
    type: A.exportCsv,
    mediaFileIdsToClipIds,
    csvFilePath,
    mediaFolderLocation,
    rememberLocation,
  }),

  exportMarkdown: (
    mediaFileIdsToClipIds: Record<MediaFileId, Array<ClipId | undefined>>
  ) => ({
    type: A.exportMarkdown,
    mediaFileIdsToClipIds,
  }),

  detectSilenceRequest: () => ({
    type: A.detectSilenceRequest,
  }),
  detectSilence: () => ({
    type: A.detectSilence,
  }),

  deleteAllCurrentFileClipsRequest: () => ({
    type: A.deleteAllCurrentFileClipsRequest,
  }),

  setAllTags: (tagsToClipIds: { [tag: string]: Array<ClipId> }) => ({
    type: A.setAllTags,
    tagsToClipIds,
  }),

  setDefaultClipSpecs: ({
    tags,
    includeStill,
  }: {
    tags?: string[]
    includeStill?: boolean
  }) => ({
    type: A.setDefaultClipSpecs,
    tags,
    includeStill,
  }),

  setProgress: (progress: ProgressInfo | null) => ({
    type: A.setProgress,
    progress,
  }),

  startEditingCards: () => ({
    type: A.startEditingCards,
  }),

  stopEditingCards: () => ({
    type: A.stopEditingCards,
  }),

  openDictionaryPopover: () => ({
    type: A.openDictionaryPopover,
  }),

  closeDictionaryPopover: () => ({
    type: A.closeDictionaryPopover,
  }),

  newCardFromSubtitlesRequest: (
    linkedSubtitlesChunkSelection: WaveformSelection & {
      type: 'Preview'
    },
    clozeDeletion?: ClozeDeletion,
    startEditing: boolean = false
  ) => ({
    type: A.newCardFromSubtitlesRequest,
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
}
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

type Actions = {
  [T in ActionType]: (...args: any[]) => ActionOf<T>
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const _validateActions: Actions = actions
/* eslint-enable @typescript-eslint/no-unused-vars */
