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
    start,
    end,
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
