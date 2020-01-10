declare type WaveformState = {
  stepsPerSecond: number
  stepLength: number
  cursor: {
    x: number
    y: number
  }
  viewBox: WaveformViewBox
}

declare type WaveformViewBox = {
  xMin: number
}
