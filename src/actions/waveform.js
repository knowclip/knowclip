export const setWaveformPeaks = (peaks) => ({
  type: 'SET_WAVEFORM_PEAKS',
  peaks,
})

export const setWaveformCursor = (x) => ({
  type: 'SET_CURSOR_POSITION',
  x,
})

export const addWaveformSelection = (selection) => ({
  type: 'ADD_WAVEFORM_SELECTION',
  selection,
})

export const setWaveformPendingSelection = (selection) => ({
  type: 'SET_WAVEFORM_PENDING_SELECTION',
  selection,
})
