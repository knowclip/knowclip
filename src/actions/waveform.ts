import A from '../types/ActionType'

export const waveformActions = {
  setCursorPosition: (x: number) => ({
    type: A.setCursorPosition as const,
    x,
  }),

  generateWaveformImages: (waveformPngs: WaveformPng[]) => ({
    type: A.generateWaveformImages as const,
    waveformPngs,
  }),
}
