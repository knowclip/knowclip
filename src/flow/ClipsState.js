// @flow
declare type WaveformX = number

declare type ClipId = string
declare type Clip = Exact<{
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
  filePath: AudioFilePath,
}>

declare type ClipsState = { [ClipId]: Clip }
