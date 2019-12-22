export const setWaveformCursor = (
  x: number,
  newViewBox?: WaveformViewBox
): SetCursorPosition => ({
  type: A.SET_CURSOR_POSITION,
  x,
  newViewBox: newViewBox || null,
})

export const setPendingClip = (clip: PendingClip): SetPendingClip => ({
  type: A.SET_PENDING_CLIP,
  clip,
})

export const clearPendingClip = (): ClearPendingClip => ({
  type: A.CLEAR_PENDING_CLIP,
})

export const setPendingStretch = (
  stretch: PendingStretch
): SetPendingStretch => ({
  type: A.SET_PENDING_STRETCH,
  stretch,
})

export const clearPendingStretch = (): ClearPendingStretch => ({
  type: A.CLEAR_PENDING_STRETCH,
})

export const setWaveformViewBox = (
  viewBox: WaveformViewBox
): SetWaveformViewBox => ({
  type: A.SET_WAVEFORM_VIEW_BOX,
  viewBox,
})

