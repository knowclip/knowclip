// @flow

declare type AppState = Exact<{
  waveform: WaveformState,
  clips: ClipsState,
  audio: MediaState,
  user: UserState,
  snackbar: SnackbarState,
  dialog: DialogState,
  projects: ProjectsState,
}>
