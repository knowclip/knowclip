export const enqueueDialog = (
  dialog: DialogData,
  skipQueue: boolean = false
): EnqueueDialog => ({
  type: A.ENQUEUE_DIALOG,
  dialog,
  skipQueue,
})

export const confirmationDialog = (message: string, action: Action, onCancel: Action | null = null) =>
  enqueueDialog({
    type: 'Confirmation',
    props: { message, action, onCancel },
  })

export const editNoteTypeDialog = (noteTypeId: NoteTypeId): DialogAction =>
  enqueueDialog({
    type: 'NoteTypeForm',
    props: { noteTypeId },
  })

export const newNoteTypeDialog = (): DialogAction =>
  enqueueDialog({
    type: 'NoteTypeForm',
    props: { noteTypeId: null },
  })

export const mediaFolderLocationFormDialog = (
  action: Action | null,
  skipQueue: boolean
): DialogAction =>
  enqueueDialog(
    {
      type: 'MediaFolderLocationForm',
      props: { action },
    },
    skipQueue
  )

export const reviewAndExportDialog = () =>
  enqueueDialog({
    type: 'ReviewAndExport',
  })

export const newProjectFormDialog = () =>
  enqueueDialog({ type: 'NewProjectForm' })

export const fileSelectionDialog = (
  message: string,
  fileRecord: FileRecord
): DialogAction =>
  enqueueDialog({ type: 'FileSelection', props: { message, fileRecord } })

export const closeDialog = (): DialogAction => ({
  type: A.CLOSE_DIALOG,
})

export const csvAndMp3ExportDialog = (clipIds: Array<ClipId>): DialogAction =>
  enqueueDialog({ type: 'CsvAndMp3Export', props: { clipIds } }, true)

export const subtitlesClipDialog = (): DialogAction =>
  enqueueDialog({ type: 'SubtitlesClips' })
