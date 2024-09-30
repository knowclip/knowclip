import stripHtml from '../utils/stripHtml'

export const sanitizeSubtitles = (
  chunks: SubtitlesChunk[]
): SubtitlesChunk[] => {
  const result = []
  let lastChunk: SubtitlesChunk | undefined
  for (const chunk of chunks) {
    if (lastChunk && lastChunk.end === chunk.start) lastChunk.end -= 1

    const text = stripHtml(chunk.text)
    if (text?.trim()) {
      result.push(chunk)
      lastChunk = chunk
    }
  }
  return result
}
