export const readVttChunk = ({
  start,
  end,
  text,
  index,
}: {
  start: number
  end: number
  text: string
  index: number
}): SubtitlesChunk => ({
  start: start,
  end: end,
  text,
  index,
})

export const readSubsrtChunk = readVttChunk
