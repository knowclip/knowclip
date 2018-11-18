// @flow

declare type AudioFilePath = String
declare type AudioFileData = {
  path: AudioFilePath,
  // clipsOrder: Array<ClipId>,
}

declare type AudioState = Exact<{
  loop: boolean,
  files: {
    [AudioFilePath]: AudioFileData,
  },
  filesOrder: Array<AudioFilePath>,
  currentFileIndex: number,
}>
