// @flow

declare type AppState = Exact<{
  waveform: WaveformState,
  clips: ClipsState,
  noteTypes: NoteTypesState,
  audio: Object,
  user: UserState,
  snackbar: SnackbarState,
  dialog: DialogState,
}>
