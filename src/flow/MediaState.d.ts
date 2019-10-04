
declare type MediaFileId = string;
declare type MediaFileName = string;
declare type MediaFilePath = string;

declare type MediaState = {
  loop: boolean,
  isLoading: boolean,
  mediaFolderLocation: string | null
  // filesMetadata: Exact<{
  //   byId: { [MediaFileId]: MediaFileMetadata },
  //   allIds: Array<MediaFileData>,
  // }>,
};

declare type MediaFileMetadata = {
  id: MediaFileId,
  name: MediaFileName,
  durationSeconds: number,
  format: "UNKNOWN" | string,
  isVideo: boolean
};
