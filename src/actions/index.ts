import * as A from '../types/ActionType'
import { WaveformSelectionExpanded } from '../selectors/cardPreview'

export * from './clips'
export * from './waveform'
export * from './snackbar'
export * from './dialog'
export * from './projects'
export * from './subtitles'
export * from './files'
export * from './dictionaries'
export * from './session'
export * from './settings'

export const initializeApp = (): Action => ({
  type: A.INITIALIZE_APP,
})

export const setCurrentFile = (index: number): Action => ({
  type: A.SET_CURRENT_FILE,
  index,
})

export const exportApkgRequest = (
  mediaFileIdsToClipIds: ReviewAndExportDialogData['mediaFileIdsToClipIds'],
  mediaOpenPrior: MediaFile | null
): ExportApkgRequest => ({
  type: A.EXPORT_APKG_REQUEST,
  mediaFileIdsToClipIds,
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

export const exportCsv = (
  mediaFileIdsToClipIds: Record<string, (string | undefined)[]>,
  csvFilePath: string,
  mediaFolderLocation: string,
  rememberLocation: boolean
): ExportCsv => ({
  type: A.EXPORT_CSV,
  mediaFileIdsToClipIds,
  csvFilePath,
  mediaFolderLocation,
  rememberLocation,
})

export const exportMarkdown = (
  mediaFileIdsToClipIds: Record<MediaFileId, Array<ClipId | undefined>>
): ExportMarkdown => ({
  type: A.EXPORT_MARKDOWN,
  mediaFileIdsToClipIds,
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
  type: A.SET_DEFAULT_CLIP_SPECS,
  tags,
  includeStill,
})

export const setProgress = (progress: ProgressInfo | null): SetProgress => ({
  type: A.SET_PROGRESS,
  progress,
})

export const startEditingCards = (): StartEditingCards => ({
  type: A.START_EDITING_CARDS,
})

export const stopEditingCards = (): StopEditingCards => ({
  type: A.STOP_EDITING_CARDS,
})

export const openDictionaryPopover = (): OpenDictionaryPopover => ({
  type: A.OPEN_DICTIONARY_POPOVER,
})

export const closeDictionaryPopover = (): CloseDictionaryPopover => ({
  type: A.CLOSE_DICTIONARY_POPOVER,
})

export const newClipFromSubtitlesChunk = (
  linkedSubtitlesChunkSelection: WaveformSelectionExpanded,
  clozeDeletion?: ClozeDeletion,
  startEditing: boolean = false
): NewCardFromSubtitlesRequest => ({
  type: A.NEW_CARD_FROM_SUBTITLES_REQUEST,
  linkedSubtitlesChunkSelection,
  clozeDeletion,
  startEditing,
})
