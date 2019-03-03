const ascending = (a, b) => a - b

const sortSelectionPoints = ({ start, end }) => [start, end].sort(ascending)

const newClip = (
  pendingSelection,
  currentFileName,
  id,
  noteType,
  tags
): Clip => {
  const [start, end] = sortSelectionPoints(pendingSelection)

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
