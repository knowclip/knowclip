declare type FileRecordsState = {
  byId: Record<FileId, FileRecord>
  idsByBaseFileId: Record<BaseFileId, Array<FileId>>
}
declare type FileId = string
declare type FilePath = string

declare type BaseFileId = string

// parent can be a file or any entity, to trigger
// loadedfile's deletion on deleted/removed from state

//maybe have a onNotFound: Action field?
declare type FilePath = string

declare type FileRecord =
  | ProjectFileRecord
  | MediaFileRecord
  | ExternalSubtitlesFileRecord
  | ConvertedVttFileRecord
  | WaveformPngRecord
  | ConstantBitrateMp3Record
  | VideoStillImageRecord

declare type ProjectFileRecord = {
  type: 'ProjectFile'
  id: FileId
  parentId: null
}
declare type MediaFileRecord = {
  type: 'MediaFile'
  id: FileId
  parentId: ProjectId
}
declare type ExternalSubtitlesFileRecord = {
  type: 'ExternalSubtitlesFile'
  // parentId: SubtitlesTrackId // should it be MediaFileId?
  id: FileId
  parentId: MediaFileId // should it be SubtitlesTrackId?
}
declare type ConvertedVttFileRecord = {
  type: 'ConvertedVttFile'
  id: FileId
  parentId: SubtitlesTrackId
}
declare type WaveformPngRecord = {
  type: 'WaveformPng'
  id: FileId
  parentId: MediaFileId
}
declare type ConstantBitrateMp3Record = {
  type: 'ConstantBitrateMp3'
  id: FileId
  parentId: MediaFileId
}
declare type VideoStillImageRecord = {
  type: 'VideoStillImage'
  id: FileId
  parentId: ClipId
}
