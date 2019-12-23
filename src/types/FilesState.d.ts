declare type FilesState = {
  ProjectFile: Record<FileId, ProjectFile>
  MediaFile: Record<FileId, MediaFile>
  VttConvertedSubtitlesFile: Record<FileId, VttConvertedSubtitlesFile>
  ExternalSubtitlesFile: Record<FileId, ExternalSubtitlesFile>
  WaveformPng: Record<FileId, WaveformPng>
  ConstantBitrateMp3: Record<FileId, ConstantBitrateMp3>
  // VideoStillImage: Record<FileId, VideoStillImageRecord>
}

declare type FileId = string
declare type FilePath = string

declare type ParentFileId = string

// parent can be a file or any entity
// TODO: to trigger fileAvailability's deletion on parent file deleted/removed from state

declare type FilePath = string

declare type FileMetadata =
  | ProjectFile
  | MediaFile
  | ExternalSubtitlesFile
  | VttConvertedSubtitlesFile
  | WaveformPng
  | ConstantBitrateMp3
// | VideoStillImageRecord

declare type ProjectFile = {
  type: 'ProjectFile'
  id: FileId
  name: string
  noteType: NoteType
  mediaFileIds: Array<MediaFileId>
  error: string | null
  lastOpened: string
  lastSaved: string
}
declare type MediaFile = {
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
declare type ExternalSubtitlesFile = {
  type: 'ExternalSubtitlesFile'
  id: FileId
  parentId: MediaFileId
  name: string
}
declare type VttConvertedSubtitlesFile =
  | {
      type: 'VttConvertedSubtitlesFile'
      id: FileId
      parentId: FileId // TODO: verify that this shouldn't be media file id
      parentType: 'ExternalSubtitlesFile'
    }
  | {
      type: 'VttConvertedSubtitlesFile'
      id: FileId
      parentId: MediaFileId
      streamIndex: number
      parentType: 'MediaFile'
    }
declare type WaveformPng = {
  type: 'WaveformPng'
  id: FileId
  // parentId: MediaFileId // TODO: verify whether this is needed
}
declare type ConstantBitrateMp3 = {
  type: 'ConstantBitrateMp3'
  id: FileId
  // parentId: MediaFileId  // TODO: verify whether this is needed
}
// declare type VideoStillImageRecord = {
//   type: 'VideoStillImage'
//   id: FileId
//   parentId: ClipId
// }
