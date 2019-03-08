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

export const setWaveformPendingClip = (clip: Clip): WaveformAction => ({
  type: 'SET_WAVEFORM_PENDING_SELECTION',
  clip,
})

export const setWaveformPendingStretch = (
  stretch: PendingStretch
): WaveformAction => ({
  type: 'SET_WAVEFORM_PENDING_STRETCH',
  stretch,
})
