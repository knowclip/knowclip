import KnowclipActionType from '../types/ActionType'
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
import { ActionCreatorOf, ActionCreators } from './actionTypeUtilities'

export type ActionOf<T extends KnowclipActionType> = ReturnType<
  ActionCreatorOf<typeof KnowclipActionType, typeof baseActions, T>
>

export type KnowclipAction = ActionOf<KnowclipActionType>

export type KnowclipActionCreatorsSubset = Partial<KnowclipActionCreators>
type KnowclipActionCreators = ActionCreators<typeof KnowclipActionType>

const appActions = {
  initializeApp: () => ({
    type: KnowclipActionType.initializeApp,
  }),

  undo: () => ({
    type: KnowclipActionType.undo,
  }),

  redo: () => ({
    type: KnowclipActionType.redo,
  }),

  // [A['@@INIT']]: () => ({
  //   type: A['@@INIT']
  // }),

  setProjectError: (error: string | null) => ({
    type: KnowclipActionType.setProjectError,
    error,
  }),

  quitApp: () => ({
    type: KnowclipActionType.quitApp,
  }),

  setCurrentFile: (index: number) => ({
    type: KnowclipActionType.setCurrentFile,
    index,
  }),

  exportApkgRequest: (
    mediaFileIdsToClipIds: ReviewAndExportDialogData['mediaFileIdsToClipIds'],
    mediaOpenPrior: MediaFile | null
  ) => ({
    type: KnowclipActionType.exportApkgRequest,
    mediaFileIdsToClipIds,
    mediaOpenPrior,
  }),

  exportApkgFailure: (errorMessage?: string) => ({
    type: KnowclipActionType.exportApkgFailure,
    errorMessage: errorMessage || null,
  }),

  exportApkgSuccess: (successMessage: string) => ({
    type: KnowclipActionType.exportApkgSuccess,
    successMessage,
  }),

  exportCsv: (
    mediaFileIdsToClipIds: Record<string, (string | undefined)[]>,
    csvFilePath: string,
    mediaFolderLocation: string,
    rememberLocation: boolean
  ) => ({
    type: KnowclipActionType.exportCsv,
    mediaFileIdsToClipIds,
    csvFilePath,
    mediaFolderLocation,
    rememberLocation,
  }),

  exportMarkdown: (
    mediaFileIdsToClipIds: Record<MediaFileId, Array<ClipId | undefined>>
  ) => ({
    type: KnowclipActionType.exportMarkdown,
    mediaFileIdsToClipIds,
  }),

  detectSilenceRequest: () => ({
    type: KnowclipActionType.detectSilenceRequest,
  }),
  detectSilence: () => ({
    type: KnowclipActionType.detectSilence,
  }),

  deleteAllCurrentFileClipsRequest: () => ({
    type: KnowclipActionType.deleteAllCurrentFileClipsRequest,
  }),

  setAllTags: (tagsToClipIds: { [tag: string]: Array<ClipId> }) => ({
    type: KnowclipActionType.setAllTags,
    tagsToClipIds,
  }),

  setDefaultClipSpecs: ({
    tags,
    includeStill,
  }: {
    tags?: string[]
    includeStill?: boolean
  }) => ({
    type: KnowclipActionType.setDefaultClipSpecs,
    tags,
    includeStill,
  }),

  setProgress: (progress: ProgressInfo | null) => ({
    type: KnowclipActionType.setProgress,
    progress,
  }),

  startEditingCards: () => ({
    type: KnowclipActionType.startEditingCards,
  }),

  stopEditingCards: () => ({
    type: KnowclipActionType.stopEditingCards,
  }),

  openDictionaryPopover: () => ({
    type: KnowclipActionType.openDictionaryPopover,
  }),

  closeDictionaryPopover: () => ({
    type: KnowclipActionType.closeDictionaryPopover,
  }),

  newCardFromSubtitlesRequest: (
    linkedSubtitlesChunkSelection: WaveformSelection & {
      type: 'Preview'
    },
    clozeDeletion?: ClozeDeletion,
    startEditing: boolean = false
  ) => ({
    type: KnowclipActionType.newCardFromSubtitlesRequest,
    linkedSubtitlesChunkSelection,
    clozeDeletion,
    startEditing,
  }),
} satisfies KnowclipActionCreatorsSubset

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
} satisfies KnowclipActionCreators

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
} satisfies KnowclipActionCreators
