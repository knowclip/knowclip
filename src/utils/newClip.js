// @flow

const ascending = (a, b) => a - b

const sortClipPoints = ({ start, end }) => [start, end].sort(ascending)

const newClip = (
  pendingClip: PendingClip,
  fileId: MediaFileId,
  id: ClipId,
  noteType: NoteType,
  tags: Array<string> = []
): Clip => {
  const [start, end] = sortClipPoints(pendingClip)

  return {
    start: +start.toFixed(2),
    end: +end.toFixed(2),
    id,
    fileId,
    flashcard: {
      id,
      tags,
      fields: noteType.fields.reduce(
        (fields, field) => ({
          ...fields,
          [field.id]: '',
        }),
        {}
      ),
    },
  }
}

export default newClip
