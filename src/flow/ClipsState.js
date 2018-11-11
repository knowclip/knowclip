// @flow

declare type WaveformX = number

declare type ClipId = String
declare type Clip = Exact<{
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
}>

declare type PendingStretch = Exact<{
  originKey: 'start' | 'end',
  id: ClipId,
  end: WaveformX,
}>
declare type ClipsState = Exact<{
  selectionsOrder: Array<ClipId>,
  selections: { [ClipId]: Clip },
  pendingSelection: ?Object,
  pendingStretch: ?PendingStretch,
  highlightedSelectionId: ?ClipId,
}>
