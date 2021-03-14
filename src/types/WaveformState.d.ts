type ViewState = {
  durationSeconds: number
  cursorMs: number
  viewBoxStartMs: number
  pixelsPerSecond: number
  selection: WaveformSelection | null
  pendingAction:
    | import('../utils/WaveformMousedownEvent').WaveformDragAction
    | null
}
