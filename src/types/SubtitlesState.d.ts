declare type SubtitlesState = {
  mediaFileTracksStreamIndexes: Array<number>
  flashcardFieldLinks: SubtitlesFlashcardFieldsLinks
}

declare type SubtitlesTrack = EmbeddedSubtitlesTrack | ExternalSubtitlesTrack
declare type TextTrackMode = 'disabled' | 'hidden' | 'showing'
declare type SubtitlesFlashcardFieldsLinks = Partial<
  Record<FlashcardFieldName, SubtitlesTrackId>
>

declare type EmbeddedSubtitlesTrack = {
  type: 'EmbeddedSubtitlesTrack'
  id: SubtitlesTrackId
  mode: TextTrackMode
  chunks: Array<SubtitlesChunk>
  mediaFileId: MediaFileId
  streamIndex: number
  tmpFilePath: string
}

declare type ExternalSubtitlesTrack = {
  type: 'ExternalSubtitlesTrack'
  id: SubtitlesTrackId
  mode: TextTrackMode
  chunks: Array<SubtitlesChunk>
  mediaFileId: MediaFileId
  filePath: SubtitlesFilePath
  vttFilePath: string
}

declare type SubtitlesChunk = {
  start: WaveformX
  end: WaveformX
  text: string
}

declare type SubtitlesTrackId = string
declare type SubtitlesFilePath = string
