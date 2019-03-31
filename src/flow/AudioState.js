// @flow

declare type MediaFileId = string
declare type MediaFilePath = string

declare type AudioState = Exact<{
  loop: boolean,
  isLoading: boolean,
  mediaFolderLocation: ?string,
  constantBitrateFilePath: ?MediaFilePath,
  // filesMetadata: Exact<{
  //   byId: { [MediaFileId]: MediaFileMetadata },
  //   allIds: Array<MediaFileData>,
  // }>,
}>

declare type MediaFileMetadata = Exact<{
  id: MediaFileId,
  name: MediaFileName,
  durationSeconds: number,
  format: 'UNKNOWN' | string,
  isVideo: boolean,
}>
