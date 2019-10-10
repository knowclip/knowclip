import newFlashcard from './newFlashcard'

const ascending = (a: number, b: number) => a - b

interface ClipPoints {
  start: number
  end: number
}

const sortClipPoints = ({ start, end }: ClipPoints) =>
  [start, end].sort(ascending)

const newClip = (
  pendingClip: PendingClip,
  fileId: string,
  id: ClipId,
  fields: FlashcardFields,
  tags?: string[]
): Clip => {
  const [start, end] = sortClipPoints(pendingClip)
  return {
    start: +start.toFixed(2),
    end: +end.toFixed(2),
    id,
    fileId,
    flashcard: newFlashcard(id, fields, tags),
  }
}

export default newClip
