type ViewState = {
  cursorX: number
  xMin: number
  stepsPerSecond: number
  stepLength: number
  selection: WaveformSelection | null
  pendingAction:
    | import('../utils/WaveformMousedownEvent').WaveformDragAction
    | null
}
