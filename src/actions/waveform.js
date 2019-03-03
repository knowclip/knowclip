// @flow

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

export const addClip = (clip: Clip): WaveformAction => ({
  type: 'ADD_CLIP',
  clip,
})

export const addClips = (
  clips: Array<Clip>,
  filePath: AudioFilePath
): WaveformAction => ({
  type: 'ADD_CLIPS',
  clips,
  filePath,
})

export const setWaveformPendingClip = (
  clip: Clip
): WaveformAction => ({
  type: 'SET_WAVEFORM_PENDING_SELECTION',
  clip,
})

export const highlightClip = (id: ?ClipId): WaveformAction => ({
  type: 'HIGHLIGHT_CLIP',
  id,
})

export const editClip = (
  id: ClipId,
  override: $Shape<Clip>
): WaveformAction => ({
  type: 'EDIT_CLIP',
  id,
  override,
})

export const setWaveformPendingStretch = (
  stretch: PendingStretch
): WaveformAction => ({
  type: 'SET_WAVEFORM_PENDING_STRETCH',
  stretch,
})

export const mergeClips = (
  ids: Array<ClipId>
): WaveformAction => ({
  type: 'MERGE_CLIPS',
  ids,
})
