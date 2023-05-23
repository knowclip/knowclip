import A from '../types/ActionType'
import { defineActionCreators } from './defineActionCreators'

export const waveformActions = defineActionCreators({
  setCursorPosition: (x: number) => ({
    type: A.setCursorPosition,
    x,
  }),

  generateWaveformImages: (waveformPngs: WaveformPng[]) => ({
    type: A.generateWaveformImages,
    waveformPngs,
  }),
})
