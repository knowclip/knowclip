import { getHighlightedClipId } from './session'
import { getFlashcard, getClipTime } from './clips'

export const getCurrentFlashcard = (state: AppState): Flashcard | null => {
  const flashcardId = getHighlightedClipId(state)
  if (!flashcardId) return null
  return getFlashcard(state, flashcardId)
}

export const getSelectedClipTime = (state: AppState): TimeSpan | null => {
  const clipId = getHighlightedClipId(state)
  return clipId ? getClipTime(state, clipId) : null
}
