export const setWaveformPeaks = (peaks) => ({
  type: 'SET_WAVEFORM_PEAKS',
  peaks,
})

export const setWaveformCursor = (x, newViewBox) => ({
  type: 'SET_CURSOR_POSITION',
  x,
  newViewBox,
})

export const addWaveformSelection = (selection) => ({
  type: 'ADD_WAVEFORM_SELECTION',
  selection,
})

export const setWaveformPendingSelection = (selection) => ({
  type: 'SET_WAVEFORM_PENDING_SELECTION',
  selection,
})
