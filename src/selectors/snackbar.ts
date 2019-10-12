export const getCurrentSnackbar = (state: AppState): SnackbarData | null =>
  state.snackbar.queue[0] || null

export const PROJECT_FILE_VERSION_MISMATCH_MESSAGE =
  'This project file does not work with this version of Audio Flashcard Assistant. Please update your software and try again.'
