// @flow

declare type AudioFilePath = string
declare type AudioFileData = Exact<{
  path: AudioFilePath,
  clipsOrder: Array<ClipId>,
  noteTypeId: NoteTypeId,
}>

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
