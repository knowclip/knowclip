// @flow

declare type AudioFileId = string
declare type AudioFilePath = string

declare type AudioState = Exact<{
  loop: boolean,
  isLoading: boolean,
  mediaFolderLocation: ?string,
  constantBitrateFilePath: ?AudioFilePath,
  // filesMetadata: Exact<{
  //   byId: { [AudioFileId]: AudioFileMetadata },
  //   allIds: Array<AudioFileData>,
  // }>,
}>

declare type AudioFileMetadata = Exact<{
  id: AudioFileId,
  name: AudioFileName,
  durationSeconds: number,
  format: string,
}>
