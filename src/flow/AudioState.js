// @flow

declare type AudioFilePath = string
declare type AudioFileData = Exact<{
  path: AudioFilePath,
  clipsOrder: Array<ClipId>,
  // noteType: NoteType,
}>

/*
declare type NoteType = { fields: Array<NoteTypeField> }
declare type NoteFieldName = string
NoteTypeField = { name: NoteFieldName }
declare type NoteField = { name: NoteFieldName, value: string }
declare type Flashcard = {
  id: ClipId,
  fields: Array<NoteField>,
}
declare type Clip = {
  start: number,
  end: number,
  flashcard: Flashcard,
}
*/

declare type AudioState = Exact<{
  loop: boolean,
  files: {
    [AudioFilePath]: AudioFileData,
  },
  filesOrder: Array<AudioFilePath>,
  currentFileIndex: number,
  isLoading: boolean,
  mediaFolderLocation: ?string,
}>
