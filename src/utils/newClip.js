import uuid from 'uuid/v4'

const ascending = (a, b) => a - b

const sortSelectionPoints = ({ start, end }) => [start, end].sort(ascending)

const newClip = (pendingSelection, currentFileName): Clip => {
  const [start, end] = sortSelectionPoints(pendingSelection)
  const id = uuid()
  return {
    start,
    end,
    id,
    filePath: currentFileName,
    flashcard: { de: '', en: '', id },
  }
}

export default newClip
