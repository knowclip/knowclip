// @flow

declare type AudioFileId = string
declare type AudioFilePath = string
declare type AudioFileData = Exact<{
  id: AudioFileId,
  path: AudioFilePath,
  noteTypeId: NoteTypeId,
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
  durationSeconds: number,
  format: string,
}>
