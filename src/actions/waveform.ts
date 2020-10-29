import A from '../types/ActionType'

export const waveformActions = {
  setCursorPosition: (x: number, newViewBox?: WaveformViewBox) => ({
    type: A.setCursorPosition,
    x,
    newViewBox: newViewBox || null,
  }),

  setPendingClip: (clip: PendingClip) => ({
    type: A.setPendingClip,
    clip,
  }),

  clearPendingClip: () => ({
    type: A.clearPendingClip,
  }),

  setPendingStretch: (stretch: PendingStretch) => ({
    type: A.setPendingStretch,
    stretch,
  }),

  clearPendingStretch: () => ({
    type: A.clearPendingStretch,
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
