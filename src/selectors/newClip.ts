import newFlashcard from '../utils/newFlashcard'
import { getDefaultTags, getDefaultIncludeStill } from './user'

const ascending = (a: number, b: number) => a - b

interface ClipPoints {
  start: number
  end: number
}

const sortClipPoints = ({ start, end }: ClipPoints) =>
  [start, end].sort(ascending)

export const getNewClip = (
  state: AppState,
  pendingClip: PendingClip,
  mediaFileId: string,
  id: ClipId,
  fields: FlashcardFields
): Clip => {
  const tags = getDefaultTags(state)
  const includeStill = getDefaultIncludeStill(state)

  const [start, end] = sortClipPoints(pendingClip)
  return {
    start: +start.toFixed(2),
    end: +end.toFixed(2),
    id,
    fileId: mediaFileId,
    flashcard: newFlashcard(id, fields, tags, includeStill),
  }
}
