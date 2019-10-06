declare type SubtitlesState = {
  loadedTracks: Array<SubtitlesTrack>
  mediaFileTracksStreamIndexes: Array<number>
  flashcardFieldLinks: { [K in FlashcardFieldName]: SubtitlesTrackId }
}

declare type SubtitlesTrack = EmbeddedSubtitlesTrack | ExternalSubtitlesTrack
declare type TextTrackMode = 'disabled' | 'hidden' | 'showing'

declare type EmbeddedSubtitlesTrack = {
  type: 'EmbeddedSubtitlesTrack'
  id: SubtitlesTrackId
  mode: TextTrackMode
  chunks: Array<SubtitlesChunk>
  streamIndex: number
  tmpFilePath: string
}

declare type ExternalSubtitlesTrack = {
  type: 'ExternalSubtitlesTrack'
  id: SubtitlesTrackId
  mode: TextTrackMode
  chunks: Array<SubtitlesChunk>
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
