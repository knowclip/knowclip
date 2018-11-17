// @flow

declare type PendingSelection = {
  start: WaveformX,
  end: WaveformX,
}

declare type PendingStretch = Exact<{
  originKey: 'start' | 'end',
  id: ClipId,
  end: WaveformX,
}>

declare type NoteTypeId = String

declare type NoteType = Exact<{
  id: NoteTypeId,
  fieldNames: Array<String>,
}>

declare type UserState = Exact<{
  pendingSelection: ?PendingSelection,
  pendingStretch: ?PendingStretch,
  highlightedSelectionId: ?ClipId,
  noteTypes: Array<NoteType>,
  noteTypeAssignments: { [AudioFilePath]: NoteTypeId },
}>
