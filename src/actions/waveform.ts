import A from '../types/ActionType'

export const waveformActions = {
  [A.setCursorPosition]: (x: number, newViewBox?: WaveformViewBox) => ({
    type: A.setCursorPosition,
    x,
    newViewBox: newViewBox || null,
  }),

  [A.setPendingClip]: (clip: PendingClip) => ({
    type: A.setPendingClip,
    clip,
  }),

  [A.clearPendingClip]: () => ({
    type: A.clearPendingClip,
  }),

  [A.setPendingStretch]: (stretch: PendingStretch) => ({
    type: A.setPendingStretch,
    stretch,
  }),

  [A.clearPendingStretch]: () => ({
    type: A.clearPendingStretch,
  }),

  [A.setWaveformViewBox]: (viewBox: WaveformViewBox) => ({
    type: A.setWaveformViewBox,
    viewBox,
  }),

  [A.generateWaveformImages]: (waveformPngs: WaveformPng[]) => ({
    type: A.generateWaveformImages,
    waveformPngs,
  }),
}
