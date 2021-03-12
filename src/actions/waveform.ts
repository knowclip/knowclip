import A from '../types/ActionType'

export const waveformActions = {
  setCursorPosition: (x: number, newViewBox?: WaveformViewBox) => ({
    type: A.setCursorPosition,
    x,
    newViewBox: newViewBox || null,
  }),

  setPendingWaveformAction: (action: PendingWaveformAction) => ({
    type: A.setPendingWaveformAction,
    action,
  }),

  clearPendingWaveformAction: () => ({
    type: A.clearPendingWaveformAction,
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

export const compositeWaveformActions = {
  setPendingClip: (clip: Omit<PendingClip, 'type'>) => {
    const action: PendingWaveformAction = {
      type: 'PendingClip',
      ...clip,
    }
    return {
      type: A.setPendingWaveformAction,
      action,
    }
  },
  setPendingMove: (move: Omit<PendingClipMove, 'type'>) => {
    const action: PendingWaveformAction = {
      type: 'PendingClipMove',
      ...move,
    }
    return {
      type: A.setPendingWaveformAction,
      action,
    }
  },

  setPendingStretch: (stretch: Omit<PendingStretch, 'type'>) => {
    const action: PendingWaveformAction = {
      type: 'PendingStretch',
      ...stretch,
    }
    return {
      type: A.setPendingWaveformAction,
      action,
    }
  },
}
