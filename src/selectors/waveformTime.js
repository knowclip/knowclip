// @flow

export const getSecondsAtX = (state: AppState, x: number): number => {
  const { stepsPerSecond, stepLength } = state.waveform
  return x / (stepsPerSecond * stepLength)
}
export const getMillisecondsAtX = (state: AppState, x: number): number => {
  return 1000 * getSecondsAtX(state, x)
}
export const getXAtMilliseconds = (
  state: AppState,
  milliseconds: number
): number => {
  const { stepsPerSecond, stepLength } = state.waveform
  return +((milliseconds / 1000) * (stepsPerSecond * stepLength)).toFixed(2)
}
