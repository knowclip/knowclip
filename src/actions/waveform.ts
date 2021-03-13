import A from '../types/ActionType'

export const waveformActions = {
  setCursorPosition: (x: number, newViewBox?: WaveformViewBox) => ({
    type: A.setCursorPosition,
    x,
    newViewBox: newViewBox || null,
  }),

  setWaveformViewBox: (viewBox: WaveformViewBox) => ({
    type: A.setWaveformViewBox,
    viewBox,
  }),

  generateWaveformImages: (waveformPngs: WaveformPng[]) => ({
    type: A.generateWaveformImages,
    waveformPngs,
  }),
}
