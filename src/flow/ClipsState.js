// @flow
declare type WaveformX = number

declare type ClipId = string
declare type Clip = Exact<{
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
  fileId: AudioFileId,
  flashcard: Flashcard,
}>

declare type ClipsState = {
  byId: { [ClipId]: Clip },
  idsByAudioFileId: { [AudioFileId]: Array<ClipId> },
}

declare type Flashcard = {
  // make exact
  id: ClipId,
  fields: { [NoteFieldId]: string },
  tags: Array<string>,
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
