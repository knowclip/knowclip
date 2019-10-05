export const enqueueSnackbar = (snackbar: SnackbarData): SnackbarAction => ({
  type: 'ENQUEUE_SNACKBAR',
  snackbar,
})

export const simpleMessageSnackbar = (message: string) =>
  enqueueSnackbar({
    type: 'SimpleMessage',
    props: { message },
  })

export const closeSnackbar = (): SnackbarAction => ({
  type: 'CLOSE_SNACKBAR',
})
