declare type FilesMetadataState = {
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

declare type FileRecord = {
  id: FileId
} & (
  | {
      type: 'ProjectFile'
      parentId: null
    }
  | {
      type: 'MediaFile'
      parentId: ProjectId
    }
  | {
      type: 'ExternalSubtitlesFile'
      parentId: SubtitlesTrackId // should it be MediaFileId?
    }
  | {
      type: 'ConvertedVttFile'
      parentId: SubtitlesTrackId
    }
  | {
      type: 'WaveformPng'
      parentId: MediaFileId
    }
  | {
      type: 'ConstantBitrateMp3'
      parentId: MediaFileId
    }
  | {
      type: 'VideoStillImage'
      parentId: ClipId
    })
