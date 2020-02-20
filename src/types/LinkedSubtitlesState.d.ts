declare type LinkedSubtitlesState = {
  trackIds: SubtitlesTrackId[]
  mediaFileId: MediaFileId
  chunks: {
    start: number
    end: number
    fields: text[]
  }[]
}
