// @flow

export type WaveformAction =
  | {| type: 'SET_WAVEFORM_PEAKS', peaks: Array<*> |}
  | {| type: 'SET_CURSOR_POSITION', x: number, newViewBox: Object |}
  | {| type: 'ADD_WAVEFORM_SELECTION', selection: Clip, filePath: FilePath |}
  | {|
      type: 'ADD_WAVEFORM_SELECTIONS',
      selections: Array<Clip>,
      filePath: FilePath,
    |}
  | {| type: 'SET_WAVEFORM_PENDING_SELECTION', selection: Clip |}
  | {| type: 'HIGHLIGHT_WAVEFORM_SELECTION', id: ClipId |}
  | {| type: 'EDIT_WAVEFORM_SELECTION', id: ClipId, override: $Shape<Clip> |}
  | {| type: 'SET_WAVEFORM_PENDING_STRETCH', stretch: PendingStretch |}
  | {| type: 'MERGE_WAVEFORM_SELECTIONS', ids: Array<ClipId> |}

export const setWaveformPeaks = (peaks: Array<*>): WaveformAction => ({
  type: 'SET_WAVEFORM_PEAKS',
  peaks,
})

export const setWaveformCursor = (
  x: number,
  newViewBox: Object
): WaveformAction => ({
  type: 'SET_CURSOR_POSITION',
  x,
  newViewBox,
})

export const addWaveformSelection = (selection: Clip): WaveformAction => ({
  type: 'ADD_WAVEFORM_SELECTION',
  selection,
})

export const addWaveformSelections = (
  selections: Array<Clip>,
  filePath: FilePath
): WaveformAction => ({
  type: 'ADD_WAVEFORM_SELECTIONS',
  selections,
  filePath,
})

export const setWaveformPendingSelection = (
  selection: Clip
): WaveformAction => ({
  type: 'SET_WAVEFORM_PENDING_SELECTION',
  selection,
})

export const highlightSelection = (id: ClipId): WaveformAction => ({
  type: 'HIGHLIGHT_WAVEFORM_SELECTION',
  id,
})

export const editWaveformSelection = (
  id: ClipId,
  override: $Shape<Clip>
): WaveformAction => ({
  type: 'EDIT_WAVEFORM_SELECTION',
  id,
  override,
})

export const setWaveformPendingStretch = (
  stretch: PendingStretch
): WaveformAction => ({
  type: 'SET_WAVEFORM_PENDING_STRETCH',
  stretch,
})

export const mergeWaveformSelections = (
  ids: Array<ClipId>
): WaveformAction => ({
  type: 'MERGE_WAVEFORM_SELECTIONS',
  ids,
})
