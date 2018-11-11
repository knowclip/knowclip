// @flow

declare type WaveformState = Exact<{
  stepsPerSecond: number,
  stepLength: number,
  cursor: { x: number, y: number },
  viewBox: { xMin: number },
  peaks: Array<String>,
}>
