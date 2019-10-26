// declare type FileRecordsState = {
//   // byId: Record<FileId, FileRecord>
//   idsByBaseFileId: Record<ParentFileId, Array<FileId>>
//   byType: Record<FileRecord['type'], Record<FileId, FileRecord>>
// }
declare type FileRecordsState = Record<
  FileRecord['type'],
  // { [fileId: string]:? FileRecord }
  Record<FileId, FileRecord>
>
declare type FileId = string
declare type FilePath = string

declare type ParentFileId = string

// parent can be a file or any entity, to trigger
// loadedfile's deletion on deleted/removed from state

//maybe have a onNotFound: Action field?
declare type FilePath = string

declare type FileRecord =
  | ProjectFileRecord
  | MediaFileRecord
  | ExternalSubtitlesFileRecord
  | TemporaryVttFileRecord
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
  // parentId: SubtitlesTrackId // should it be MediaFileId? or even needed?
  id: FileId
  parentId: MediaFileId // should it be SubtitlesTrackId? or even needed?
}
declare type TemporaryVttFileRecord =
  | {
      type: 'TemporaryVttFile'
      id: FileId // can just be subtitles track/original file id?
      parentId: SubtitlesTrackId
      parentType: 'ExternalSubtitlesTrack'
    }
  | {
      type: 'TemporaryVttFile'
      id: FileId // can just be subtitles track/original file id?
      parentId: MediaFileId
      streamIndex: number
      parentType: 'EmbeddedSubtitlesTrack'
    }
declare type WaveformPngRecord = {
  type: 'WaveformPng'
  id: FileId // can just be mediafileid?
  parentId: MediaFileId
}
declare type ConstantBitrateMp3Record = {
  type: 'ConstantBitrateMp3'
  id: FileId // can just be mediafileid?
  parentId: MediaFileId
}
declare type VideoStillImageRecord = {
  type: 'VideoStillImage'
  id: FileId // can just be cliipid?
  parentId: ClipId
}
