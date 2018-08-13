export const setWaveformPath = (path) => ({
  type: 'SET_WAVEFORM_PATH',
  path,
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
