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
