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

declare type UserState = Exact<{
  pendingSelection: ?PendingSelection,
  pendingStretch: ?PendingStretch,
  highlightedSelectionId: ?ClipId,
  defaultNoteTypeId: ?NoteTypeId,
  defaultTags: Array<string>,
}>
