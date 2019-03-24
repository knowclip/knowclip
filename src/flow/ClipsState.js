// @flow
declare type WaveformX = number

declare type ClipId = string
declare type Clip = Exact<{
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
  fileId: MediaFileId,
  flashcard: Flashcard,
}>

declare type ClipsState = {
  byId: { [ClipId]: Clip },
  idsByMediaFileId: { [MediaFileId]: Array<ClipId> },
}

declare type Flashcard = {
  // make exact
  id: ClipId,
  fields: { [NoteFieldId]: string },
  tags: Array<string>,
}

declare type PendingClip = {
  start: WaveformX,
  end: WaveformX,
}

// project file version 0.0.0
declare type ClipWithoutFilePath = Exact<{
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
  flashcard: {
    id: ClipId,
    fields: { [NoteFieldId]: string },
    tags: ?Array<string>,
  },
}>
