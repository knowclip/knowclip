// @flow

export const setWaveformImagePath = (path: ?string): WaveformAction => ({
  type: 'SET_WAVEFORM_IMAGE_PATH',
  path,
})

export const setWaveformCursor = (
  x: number,
  newViewBox: Object
): WaveformAction => ({
  type: 'SET_CURSOR_POSITION',
  x,
  newViewBox,
})

export const setPendingClip = (clip: Clip): WaveformAction => ({
  type: 'SET_PENDING_CLIP',
  clip,
})

export const setPendingStretch = (
  stretch: PendingStretch
): SetPendingStretch => ({
  type: 'SET_PENDING_STRETCH',
  stretch,
})

export const clearPendingStretch = (): ClearPendingStretch => ({
  type: 'CLEAR_PENDING_STRETCH',
})

export const setWaveformViewBox = (
  viewBox: WaveformViewBox
): WaveformAction => ({
  type: 'SET_WAVEFORM_VIEW_BOX',
  viewBox,
})
