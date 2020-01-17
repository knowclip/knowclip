import {
  getSecondsAtXFromWaveform,
  getXAtMillisecondsFromWaveform,
} from '../utils/waveformCoordinates'

export const getSecondsAtX = (state: AppState, x: number): number =>
  getSecondsAtXFromWaveform(state.waveform, x)
export const getMillisecondsAtX = (state: AppState, x: number): number => {
  return 1000 * getSecondsAtX(state, x)
}

export const getXAtMilliseconds = (
  state: AppState,
  milliseconds: number
): number => getXAtMillisecondsFromWaveform(state.waveform, milliseconds)
