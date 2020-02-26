import { getClip } from './clips'

type ExpandedPendingStretch = {
  id: ClipId
  start: WaveformX
  end: WaveformX
}

export const getPendingStretch = (
  state: AppState
): ExpandedPendingStretch | null => {
  if (!state.clips) return null
  const { pendingStretch } = state.session
  if (!pendingStretch) return null

  const stretchedClip = getClip(state, pendingStretch.id)
  if (!stretchedClip)
    throw new Error('Impossible: no stretched clip ' + pendingStretch.id)

  const { originKey } = pendingStretch
  const [start, end] = [pendingStretch.end, stretchedClip[originKey]].sort()
  return { id: pendingStretch.id, start, end }
}

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

export const getHighlightedChunkIndex = (state: AppState): number | null =>
  state.session.waveformSelection &&
  state.session.waveformSelection.type === 'Preview'
    ? state.session.waveformSelection.cardBaseIndex
    : null

export const getPendingClip = (state: AppState): PendingClip | null =>
  state.session.pendingClip

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
