// @flow

export const getCurrentSnackbar = (state: AppState): ?SnackbarData =>
  state.snackbar.queue[0] || null
