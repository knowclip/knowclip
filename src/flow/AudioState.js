// @flow

declare type AudioFilePath = String

declare type AudioState = Exact<{
  loop: boolean,
  filePaths: Array<AudioFilePath>,
  currentFileIndex: number,
}>
