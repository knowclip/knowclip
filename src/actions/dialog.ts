import * as A from '../types/ActionType'

export const enqueueDialog = (
  dialog: DialogData,
  skipQueue: boolean = false
): EnqueueDialog => ({
  type: A.ENQUEUE_DIALOG,
  dialog,
  skipQueue,
})

export const confirmationDialog = (
  message: string,
  action: Action,
  onCancel: Action | null = null,
  skipQueue: boolean = false
) =>
  enqueueDialog(
    {
      type: 'Confirmation',
      message,
      action,
      onCancel,
    },
    skipQueue
  )
export const errorDialog = (message: string, log: string) =>
  enqueueDialog(
    {
      type: 'Error',
      message,
      log,
    },
    true
  )

export const mediaFolderLocationFormDialog = (
  action: Action | null,
  skipQueue: boolean
): DialogAction =>
  enqueueDialog(
    {
      type: 'MediaFolderLocationForm',
      action,
    },
    skipQueue
  )

export const reviewAndExportDialog = (
  mediaOpenPrior: MediaFile | null,
  mediaFileIdsToClipIds: ReviewAndExportDialogData['mediaFileIdsToClipIds']
) =>
  enqueueDialog({
    type: 'ReviewAndExport',
    mediaOpenPrior,
    mediaFileIdsToClipIds: mediaFileIdsToClipIds,
  })

export const newProjectFormDialog = () =>
  enqueueDialog({ type: 'NewProjectForm' })

export const fileSelectionDialog = (
  message: string,
  file: FileMetadata
): DialogAction => enqueueDialog({ type: 'FileSelection', message, file })

export const closeDialog = (): DialogAction => ({
  type: A.CLOSE_DIALOG,
})

export const csvAndMp3ExportDialog = (
  mediaFileIdsToClipIds: ReviewAndExportDialogData['mediaFileIdsToClipIds']
): DialogAction =>
  enqueueDialog({ type: 'CsvAndMp3Export', mediaFileIdsToClipIds }, true)

export const subtitlesClipDialog = (): DialogAction =>
  enqueueDialog({ type: 'SubtitlesClips' })

export const settingsDialog = (): DialogAction =>
  enqueueDialog({ type: 'Settings' }, true)

export const linkSubtitlesDialog = (
  subtitles: ExternalSubtitlesFile | VttFromEmbeddedSubtitles,
  mediaFileId: MediaFileId
): DialogAction =>
  enqueueDialog({
    type: 'LinkSubtitles',
    subtitles,
    mediaFileId,
  })

export const dictionariesDialog = (): DialogAction =>
  enqueueDialog(
    {
      type: 'Dictionaries',
    },
    true
  )
