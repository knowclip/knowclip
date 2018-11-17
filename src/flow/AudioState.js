// @flow

declare type AudioFilePath = String
declare type AudioFileData = {
  path: AudioFilePath,
}

declare type AudioState = Exact<{
  loop: boolean,
  files: {
    [AudioFilePath]: AudioFileData,
  },
  filesOrder: Array<AudioFilePath>,
  currentFileIndex: number,
}>
