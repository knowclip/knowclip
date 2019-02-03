// @flow

declare type AppState = Exact<{
  waveform: WaveformState,
  clips: ClipsState,
  noteTypes: NoteTypesState,
  audio: AudioState,
  user: UserState,
  snackbar: SnackbarState,
  dialog: DialogState,
}>
