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
  id: string,
  tags: string[] = [],
  fields: FlashcardFields
): Clip => {
  const [start, end] = sortClipPoints(pendingClip)

  return {
    start: +start.toFixed(2),
    end: +end.toFixed(2),
    id,
    fileId,
    flashcard: !('pronunciation' in fields)
      ? {
          id,
          tags,
          type: 'Simple',
          fields: {
            transcription: fields.transcription,
            meaning: fields.meaning,
            notes: fields.notes,
          },
        }
      : {
          id,
          tags,
          type: 'Transliteration',
          fields: {
            transcription: fields.transcription,
            pronunciation: fields.pronunciation,
            meaning: fields.meaning,
            notes: fields.notes,
          },
        },
  }
}

export default newClip
