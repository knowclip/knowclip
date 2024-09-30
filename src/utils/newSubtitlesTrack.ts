export const newExternalSubtitlesTrack = (
  id: string,
  chunks: Array<SubtitlesChunk>
): ExternalSubtitlesTrack => ({
  mode: 'hidden',
  type: 'ExternalSubtitlesTrack',
  id,
  chunks,
})
export const newEmbeddedSubtitlesTrack = (
  id: string,
  chunks: Array<SubtitlesChunk>
): EmbeddedSubtitlesTrack => ({
  type: 'EmbeddedSubtitlesTrack',
  id,
  mode: 'hidden',
  chunks,
})
