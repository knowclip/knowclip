const ascending = (a, b) => a - b

const sortClipPoints = ({ start, end }) => [start, end].sort(ascending)

const newClip = (pendingClip, currentFileName, id, noteType, tags): Clip => {
  const [start, end] = sortClipPoints(pendingClip)

  return {
    start,
    end,
    id,
    filePath: currentFileName,
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
