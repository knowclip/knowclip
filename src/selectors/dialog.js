// @flow

export const getCurrentDialog = (state: AppState): ?DialogData =>
  state.dialog.queue[0] || null
