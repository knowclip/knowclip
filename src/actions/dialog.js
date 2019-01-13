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

export const closeDialog = (): DialogAction => ({
  type: 'CLOSE_DIALOG',
})
