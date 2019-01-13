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

declare type ClipsState = {
  byId: { [ClipId]: Clip },
  idsByFilePath: { [AudioFilePath]: Array<ClipId> },
}

declare type Flashcard = {
  // make exact
  id: ClipId,
  fields: { [NoteFieldName]: NoteField },
}

declare type NoteField = {
  name: NoteFieldName,
  value: string,
}
