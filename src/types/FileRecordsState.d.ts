declare type FileRecordsState = {
  ProjectFile: Record<FileId, ProjectFileRecord>
  MediaFile: Record<FileId, MediaFileRecord>
  TemporaryVttFile: Record<FileId, TemporaryVttFileRecord>
  ExternalSubtitlesFile: Record<FileId, ExternalSubtitlesFileRecord>
  WaveformPng: Record<FileId, WaveformPngRecord>
  ConstantBitrateMp3: Record<FileId, ConstantBitrateMp3Record>
  // VideoStillImage: Record<FileId, VideoStillImageRecord>
}

declare type FileId = string
declare type FilePath = string

declare type ParentFileId = string

// parent can be a file or any entity
// TODO: to trigger loadedfile's deletion on parent file deleted/removed from state

declare type FilePath = string

declare type FileRecord =
  | ProjectFileRecord
  | MediaFileRecord
  | ExternalSubtitlesFileRecord
  | TemporaryVttFileRecord
  | WaveformPngRecord
  | ConstantBitrateMp3Record
// | VideoStillImageRecord

declare type ProjectFileRecord = {
  type: 'ProjectFile'
  id: FileId
  name: string
  noteType: NoteType
  mediaFileIds: Array<MediaFileId>
  error: string | null
  lastOpened: string
  lastSaved: string
}
declare type MediaFileRecord = {
  type: 'MediaFile'
  id: FileId
  parentId: ProjectId

  subtitles: Array<SubtitlesTrackId>
  flashcardFieldsToSubtitlesTracks: SubtitlesFlashcardFieldsLinks

  name: MediaFileName
  durationSeconds: number
  format: 'UNKNOWN' | string
  isVideo: boolean
  subtitlesTracksStreamIndexes: number[]
}
declare type ExternalSubtitlesFileRecord = {
  type: 'ExternalSubtitlesFile'
  id: FileId
  parentId: MediaFileId
  name: string
}
declare type TemporaryVttFileRecord =
  | {
      type: 'TemporaryVttFile'
      id: FileId
      parentId: FileId // TODO: verify that this shouldn't be media file id
      parentType: 'ExternalSubtitlesFile'
    }
  | {
      type: 'TemporaryVttFile'
      id: FileId
      parentId: MediaFileId
      streamIndex: number
      parentType: 'MediaFile'
    }
declare type WaveformPngRecord = {
  type: 'WaveformPng'
  id: FileId
  // parentId: MediaFileId // TODO: verify whether this is needed
}
declare type ConstantBitrateMp3Record = {
  type: 'ConstantBitrateMp3'
  id: FileId
  // parentId: MediaFileId  // TODO: verify whether this is needed
}
// declare type VideoStillImageRecord = {
//   type: 'VideoStillImage'
//   id: FileId
//   parentId: ClipId
// }
