import A from '../types/ActionType'
import { WaveformSelectionExpanded } from '../selectors/cardPreview'

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

type ValueOf<T> = T[keyof T]

type ActionType = keyof typeof A
export type ActionOf<T extends ActionType> = ReturnType<
  typeof baseActions[T]
> extends { type: T }
  ? ReturnType<typeof baseActions[T]>
  : never
export type Action = ActionOf<ActionType>

const appActions = {
  [A.initializeApp]: () => ({
    type: A.initializeApp,
  }),

  // [A['@@INIT']]: () => ({
  //   type: A['@@INIT']
  // }),

  [A.setProjectError]: (error: string | null) => ({
    type: A.setProjectError,
    error,
  }),

  [A.quitApp]: () => ({
    type: A.quitApp,
  }),

  [A.setCurrentFile]: (index: number) => ({
    type: A.setCurrentFile,
    index,
  }),

  [A.exportApkgRequest]: (
    mediaFileIdsToClipIds: ReviewAndExportDialogData['mediaFileIdsToClipIds'],
    mediaOpenPrior: MediaFile | null
  ) => ({
    type: A.exportApkgRequest,
    mediaFileIdsToClipIds,
    mediaOpenPrior,
  }),

  [A.exportApkgFailure]: (errorMessage?: string) => ({
    type: A.exportApkgFailure,
    errorMessage: errorMessage || null,
  }),

  [A.exportApkgSuccess]: (successMessage: string) => ({
    type: A.exportApkgSuccess,
    successMessage,
  }),

  [A.exportCsv]: (
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

  [A.exportMarkdown]: (
    mediaFileIdsToClipIds: Record<MediaFileId, Array<ClipId | undefined>>
  ) => ({
    type: A.exportMarkdown,
    mediaFileIdsToClipIds,
  }),

  [A.detectSilenceRequest]: () => ({
    type: A.detectSilenceRequest,
  }),
  [A.detectSilence]: () => ({
    type: A.detectSilence,
  }),

  [A.deleteAllCurrentFileClipsRequest]: () => ({
    type: A.deleteAllCurrentFileClipsRequest,
  }),

  [A.setAllTags]: (tagsToClipIds: { [tag: string]: Array<ClipId> }) => ({
    type: A.setAllTags,
    tagsToClipIds,
  }),

  [A.setDefaultClipSpecs]: ({
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

  [A.setProgress]: (progress: ProgressInfo | null) => ({
    type: A.setProgress,
    progress,
  }),

  [A.startEditingCards]: () => ({
    type: A.startEditingCards,
  }),

  [A.stopEditingCards]: () => ({
    type: A.stopEditingCards,
  }),

  [A.openDictionaryPopover]: () => ({
    type: A.openDictionaryPopover,
  }),

  [A.closeDictionaryPopover]: () => ({
    type: A.closeDictionaryPopover,
  }),

  [A.newCardFromSubtitlesRequest]: (
    linkedSubtitlesChunkSelection: WaveformSelectionExpanded & {
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
