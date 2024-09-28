import A from '../types/ActionType'
import { KnowclipActionCreatorsSubset } from '.'

export const waveformActions = {
  setCursorPosition: (x: number) => ({
    type: A.setCursorPosition,
    x,
  }),

  generateWaveformImages: (waveformPngs: WaveformPng[]) => ({
    type: A.generateWaveformImages,
    waveformPngs,
  }),
} satisfies KnowclipActionCreatorsSubset
