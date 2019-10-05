export const setWaveformImagePath = (path: string | null) => ({
  type: 'SET_WAVEFORM_IMAGE_PATH',
  path,
})

export const setWaveformCursor = (
  x: number,
  newViewBox?: WaveformViewBox
): SetCursorPosition => ({
  type: 'SET_CURSOR_POSITION',
  x,
  newViewBox: newViewBox || null,
})

export const setPendingClip = (clip: PendingClip): SetPendingClip => ({
  type: 'SET_PENDING_CLIP',
  clip,
})

export const clearPendingClip = (): ClearPendingClip => ({
  type: 'CLEAR_PENDING_CLIP',
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

export const setWaveformViewBox = (viewBox: WaveformViewBox) => ({
  type: 'SET_WAVEFORM_VIEW_BOX',
  viewBox,
})

export const waveformMousedown = (x: number): WaveformMousedown => ({
  type: 'WAVEFORM_MOUSEDOWN',
  x,
})
