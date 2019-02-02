// @flow

export const enqueueDialog = (dialog: DialogData): DialogAction => ({
  type: 'ENQUEUE_DIALOG',
  dialog,
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
  action: ?AppAction
): DialogAction =>
  enqueueDialog({
    type: 'MediaFolderLocationForm',
    props: { action },
  })

export const closeDialog = (): DialogAction => ({
  type: 'CLOSE_DIALOG',
})
