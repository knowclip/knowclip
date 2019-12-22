declare type MediaFileId = string
declare type MediaFileName = string
declare type MediaFilePath = string

declare type MediaState = {
  byId: Record<MediaFileId, MediaFile>
}

declare type MediaFileMetadata = {
  id: MediaFileId
  name: MediaFileName
  durationSeconds: number
  format: 'UNKNOWN' | string
  isVideo: boolean
  subtitlesTracksStreamIndexes: number[]
}

declare type SubtitlesFlashcardFieldsLinks = Partial<
  Record<FlashcardFieldName, SubtitlesTrackId>
>

declare type MediaFileMetadata_Pre_4 = {
  id: MediaFileId
  name: MediaFileName
  durationSeconds: number
  format: 'UNKNOWN' | string
  isVideo: boolean
}
