type ViewState = {
  durationSeconds: number
  cursorMs: number
  viewBoxStartMs: number
  stepsPerSecond: number
  stepLength: number
  selection: WaveformSelection | null
  pendingAction:
    | import('../utils/WaveformMousedownEvent').WaveformDragAction
    | null
}
