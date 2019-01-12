// @flow

declare type AppState = Exact<{
  waveform: WaveformState,
  clips: ClipsState,
  // flashcards: FlashcardsState,
  audio: Object,
  user: UserState,
  snackbar: SnackbarState,
  dialog: DialogState,
}>
