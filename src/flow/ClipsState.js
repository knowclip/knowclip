// @flow
declare type WaveformX = number

declare type ClipId = string
declare type Clip = Exact<{
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
  filePath: AudioFilePath,
  flashcard: Flashcard,
}>

declare type ClipWithoutFilePath = Exact<{
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
  flashcard: Flashcard,
}>

declare type ClipsState = {
  byId: { [ClipId]: Clip },
  idsByFilePath: { [AudioFilePath]: Array<ClipId> },
}

declare type Flashcard = {
  // make exact
  id: ClipId,
  fields: { [NoteFieldId]: string },
}
