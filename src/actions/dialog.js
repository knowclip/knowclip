// @flow

export const enqueueDialog = (
  dialog: DialogData,
  skipQueue: boolean = false
): DialogAction => ({
  type: 'ENQUEUE_DIALOG',
  dialog,
  skipQueue,
})

export const confirmationDialog = (message: string, action: AppAction) =>
  enqueueDialog({
    type: 'Confirmation',
    props: { message, action },
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
  action: ?AppAction,
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

export const closeDialog = (): DialogAction => ({
  type: 'CLOSE_DIALOG',
})
