import { getClip } from './clips'

export const getHighlightedClipId = (state: AppState): ClipId | null =>
  state.session.waveformSelection &&
  state.session.waveformSelection.type === 'Clip'
    ? state.session.waveformSelection.id
    : null

export const getHighlightedClip = (state: AppState): Clip | null => {
  const highlightedClipId = getHighlightedClipId(state)
  return highlightedClipId ? getClip(state, highlightedClipId) : null
}

export const getHighlightedFlashcard = (state: AppState): Flashcard | null => {
  const highlightedClipId = getHighlightedClipId(state)
  return highlightedClipId ? state.clips.flashcards[highlightedClipId] : null
}

export const getAllTags = (state: AppState): Array<string> => {
  const tags = Object.keys(state.session.tagsToClipIds)
  return tags.reduce((a, b) => a.concat(b), [] as Array<string>)
}
export const getDefaultTags = (state: AppState): Array<string> =>
  state.session.defaultTags

export const getDefaultIncludeStill = (state: AppState): boolean =>
  state.session.defaultIncludeStill

export const isUserEditingCards = (state: AppState): boolean =>
  state.session.editingCards
