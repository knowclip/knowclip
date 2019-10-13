declare type MediaFileId = string
declare type MediaFileName = string
declare type MediaFilePath = string

declare type MediaState = {
  byId: Record<MediaFileId, MediaFile>
}

declare type MediaFile = {
  metadata: MediaFileMetadata
  filePath: MediaFilePath | null
  constantBitrateFilePath: MediaFilePath | null
  error: string | null // maybe move to user state
  subtitles: Array<SubtitlesTrack>
}

declare type MediaFileMetadata = {
  id: MediaFileId
  name: MediaFileName
  durationSeconds: number
  format: 'UNKNOWN' | string
  isVideo: boolean
}
