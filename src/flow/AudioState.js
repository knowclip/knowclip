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
  currentFileIndex: number,
  isLoading: boolean,
  mediaFolderLocation: ?string,
  filesMetadata: Exact<{
    byId: { [AudioFileId]: AudioFileMetadata },
    allIds: Array<AudioFileData>,
  }>,
}>

declare type AudioFileMetadata = Exact<{
  id: AudioFileId,
  name: AudioFileName,
  durationSeconds: number,
  format: string,
}>
