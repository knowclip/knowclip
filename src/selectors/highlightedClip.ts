import { getHighlightedClipId } from './session'
import { getFlashcard, getClipTimeInSeconds } from './clips'

export const getCurrentFlashcard = (state: AppState): Flashcard | null => {
  const flashcardId = getHighlightedClipId(state)
  if (!flashcardId) return null
  return getFlashcard(state, flashcardId)
}

export const getSelectedClipTimeInSeconds = (
  state: AppState
): TimeSpan | null => {
  const clipId = getHighlightedClipId(state)
  return clipId ? getClipTimeInSeconds(state, clipId) : null
}
