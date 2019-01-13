const ascending = (a, b) => a - b

const sortSelectionPoints = ({ start, end }) => [start, end].sort(ascending)

const newClip = (pendingSelection, currentFileName, id): Clip => {
  const [start, end] = sortSelectionPoints(pendingSelection)

  return {
    start,
    end,
    id,
    filePath: currentFileName,
    flashcard: { de: '', en: '', id },
  }
}

export default newClip
