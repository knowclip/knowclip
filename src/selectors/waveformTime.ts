import {
  getSecondsAtXFromWaveform,
  getXAtMillisecondsFromWaveform,
} from '../utils/waveformCoordinates'

export const getSecondsAtX = (x: number): number => getSecondsAtXFromWaveform(x)
export const getMillisecondsAtX = (x: number): number => {
  return 1000 * getSecondsAtX(x)
}

export const getXAtMilliseconds = (milliseconds: number): number =>
  getXAtMillisecondsFromWaveform(milliseconds)
