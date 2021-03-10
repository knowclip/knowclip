declare type AppState = {
  waveform: WaveformState
  clips: ClipsState
  snackbar: SnackbarState
  dialog: DialogState
  subtitles: SubtitlesState
  fileAvailabilities: FileAvailabilitiesState
  files: FilesState
  session: SessionState
  settings: SettingsState
}

declare type HistoryEntry<S extends AppState> = {
  state: S
  triggerAction: Action | null
}

declare type WithHistory<S extends AppState> = S & {
  lastHistoryAction: Action | null
  previous: HistoryEntry<S>[]
  next: HistoryEntry<S>[]
}
