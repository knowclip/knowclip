declare type FilesState = {
  ProjectFile: Dict<FileId, ProjectFile>
  MediaFile: Dict<FileId, MediaFile>
  VttConvertedSubtitlesFile: Dict<FileId, VttConvertedSubtitlesFile>
  ExternalSubtitlesFile: Dict<FileId, ExternalSubtitlesFile>
  WaveformPng: Dict<FileId, WaveformPng>
  VideoStillImage: Dict<FileId, VideoStillImageFile>
  Dictionary: Dict<FileId, DictionaryFile>
}

declare type FileId = string
declare type FilePath = string

declare type ParentFileId = string

declare type FileMetadata =
  | ProjectFile
  | MediaFile
  | ExternalSubtitlesFile
  | VttConvertedSubtitlesFile
  | WaveformPng
  | VideoStillImageFile
  | DictionaryFile

declare type ProjectFile = {
  type: 'ProjectFile'
  id: FileId
  name: string
  noteType: NoteType
  mediaFileIds: Array<MediaFileId>
  error: string | null
  lastSaved: string
  createdAt: string
}
declare type MediaFile = VideoFile | AudioFile

type SubtitlesFlashcardFieldsLinks =
  import('./Project').SubtitlesFlashcardFieldsLinks

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
  chunksMetadata: SubtitlesChunksMetadata | null
}
declare type VttConvertedSubtitlesFile =
  | VttFromExternalSubtitles
  | VttFromEmbeddedSubtitles
declare type VttFromExternalSubtitles = {
  type: 'VttConvertedSubtitlesFile'
  id: FileId
  parentId: FileId // TODO: verify that this shouldn't be media file id
  parentType: 'ExternalSubtitlesFile'
  chunksMetadata: SubtitlesChunksMetadata | null
}
declare type VttFromEmbeddedSubtitles = {
  type: 'VttConvertedSubtitlesFile'
  id: FileId
  parentId: MediaFileId
  streamIndex: number
  parentType: 'MediaFile'
  chunksMetadata: SubtitlesChunksMetadata | null
}
declare type SubtitlesChunksMetadata =
  | {
      count: number
      endCue: number
    }
  | {
      count: number
      endCueMs: number
    }

declare type WaveformPng = {
  type: 'WaveformPng'
  id: FileId
  parentId: MediaFileId
  startSeconds: number
  endSeconds: number
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

declare type DictionaryFile =
  | YomichanDictionary
  | CEDictDictionary
  | DictCCDictionary

declare interface YomichanDictionary extends DictionaryFileBase {
  dictionaryType: 'YomichanDictionary'
}
declare interface CEDictDictionary extends DictionaryFileBase {
  dictionaryType: 'CEDictDictionary'
}
declare interface DictCCDictionary extends DictionaryFileBase {
  dictionaryType: 'DictCCDictionary'
}

declare type DictionaryFileBase = {
  type: 'Dictionary'
  dictionaryType: DictionaryFileType
  id: FileId
  key: number
  name: string
  importComplete: boolean
}

declare type DictionaryFileType =
  | 'YomichanDictionary'
  | 'CEDictDictionary'
  | 'DictCCDictionary'
