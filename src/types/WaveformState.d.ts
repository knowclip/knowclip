declare type WaveformState = {
  stepsPerSecond: number
  stepLength: number
  cursor: {
    x: number
    y: number
  }
  viewBox: WaveformViewBox
  path: string | null
}

declare type WaveformViewBox = {
  xMin: number
}
