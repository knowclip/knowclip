// @flow

declare type WaveformState = Exact<{
  stepsPerSecond: number,
  stepLength: number,
  cursor: { x: number, y: number },
  viewBox: WaveformViewBox,
  path: ?string,
}>

declare type WaveformViewBox = { xMin: number }
