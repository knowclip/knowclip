// @flow

declare type AudioFileId = string
declare type AudioFilePath = string
declare type AudioFileData = Exact<{
  id: AudioFileId,
  path: AudioFilePath,
  noteTypeId: NoteTypeId, // bye bye
}>

declare type AudioState = Exact<{
  loop: boolean,
  files: {
    [AudioFileId]: AudioFileData,
  },
  filesOrder: Array<AudioFilePath>,
  currentFileIndex: number,
  isLoading: boolean,
  mediaFolderLocation: ?string,
}>

declare type AudioFileMetadata = Exact<{
  id: AudioFileId,
  name: AudioFileName,
  durationSeconds: number,
  format: string,
}>
