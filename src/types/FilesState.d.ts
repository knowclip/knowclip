declare type FilesState = {
  ProjectFile: Dict<FileId, ProjectFile>
  MediaFile: Dict<FileId, MediaFile>
  VttConvertedSubtitlesFile: Dict<FileId, VttConvertedSubtitlesFile>
  ExternalSubtitlesFile: Dict<FileId, ExternalSubtitlesFile>
  WaveformPng: Dict<FileId, WaveformPng>
  ConstantBitrateMp3: Dict<FileId, ConstantBitrateMp3>
  VideoStillImage: Dict<FileId, VideoStillImageFile>
}

declare type FileId = string
declare type FilePath = string

declare type ParentFileId = string

declare type FilePath = string

declare type FileMetadata =
  | ProjectFile
  | MediaFile
  | ExternalSubtitlesFile
  | VttConvertedSubtitlesFile
  | WaveformPng
  | ConstantBitrateMp3
  | VideoStillImageFile

declare type ProjectFile = {
  type: 'ProjectFile'
  id: FileId
  name: string
  noteType: NoteType
  mediaFileIds: Array<MediaFileId>
  error: string | null
  lastSaved: string
}
declare type MediaFile = VideoFile | AudioFile

type SubtitlesFlashcardFieldsLinks = import('./Project').SubtitlesFlashcardFieldsLinks

declare type AudioFile = {
  type: 'MediaFile'
  id: FileId
  parentId: ProjectId

  subtitles: Array<MediaSubtitlesRelation>
  flashcardFieldsToSubtitlesTracks: SubtitlesFlashcardFieldsLinks

  name: MediaFileName
  durationSeconds: number
  format: 'UNKNOWN' | string
  isVideo: false
  subtitlesTracksStreamIndexes: number[]
}
declare type VideoFile = {
  type: 'MediaFile'
  id: FileId
  parentId: ProjectId

  subtitles: Array<MediaSubtitlesRelation>
  flashcardFieldsToSubtitlesTracks: SubtitlesFlashcardFieldsLinks

  name: MediaFileName
  durationSeconds: number
  format: 'UNKNOWN' | string
  isVideo: true
  width: number
  height: number
  subtitlesTracksStreamIndexes: number[]
}

declare type MediaSubtitlesRelation =
  | EmbeddedSubtitlesTrackRelation
  | ExternalSubtitlesTrackRelation
declare type EmbeddedSubtitlesTrackRelation = {
  type: 'EmbeddedSubtitlesTrack'
  id: string
  streamIndex: number
}
declare type ExternalSubtitlesTrackRelation = {
  type: 'ExternalSubtitlesTrack'
  id: string
}

declare type SubtitlesFile = ExternalSubtitlesFile | VttConvertedSubtitlesFile

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
  parentId: MediaFileId
}
declare type ConstantBitrateMp3 = {
  type: 'ConstantBitrateMp3'
  id: FileId
  parentId: MediaFileId
}

declare type VideoStillImageFile = {
  type: 'VideoStillImage'
  id: ClipId
  mediaFileId: MediaFileId
}
declare type UserProvidedImageFile = {
  type: 'UserProvidedImage'
  id: FileId
  parentId: ClipId
}
