// @flow

declare type AppState = Exact<{
  waveform: WaveformState,
  clips: ClipsState,
  audio: AudioState,
  user: UserState,
  snackbar: SnackbarState,
  dialog: DialogState,
  projects: ProjectsState,
}>
