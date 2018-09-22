import uuid from 'uuid/v4'

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

export const highlightSelection = id => ({
  type: 'HIGHLIGHT_WAVEFORM_SELECTION',
  id,
})

export const editWaveformSelection = (id, override) => ({
  type: 'EDIT_WAVEFORM_SELECTION',
  id,
  override,
})

export const setWaveformPendingStretch = (stretch) => ({
  type: 'SET_WAVEFORM_PENDING_STRETCH',
  stretch,
})


export const mergeWaveformSelections = (ids) => ({
  type: 'MERGE_WAVEFORM_SELECTIONS',
  ids
})
