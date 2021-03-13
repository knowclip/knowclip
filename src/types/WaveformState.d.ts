declare type WaveformState = {
  stepsPerSecond: number
  stepLength: number
  cursor: {
    x: number
    y: number
  }
  viewBox: WaveformViewBox
  length: number
}

declare type WaveformViewBox = {
  xMin: number
}


type ViewState = {
  cursorX: number
  xMin: number
  stepsPerSecond: number
  stepLength: number
  selection: WaveformSelection | null
  pendingAction: import("../utils/WaveformMousedownEvent").WaveformDragAction | null
}