// @flow
import { getSecondsAtX } from './waveformTime'
import * as audioSelectors from './audio'

export const WAVEFORM_HEIGHT = 50
export const SELECTION_BORDER_WIDTH = 10
export const SELECTION_THRESHOLD = 40

export * from './waveformTime'
export * from './clips'
export * from './audio'
export * from './snackbar'
export * from './dialog'
export * from './noteTypes'

type ExpandedFlashcard = {
  id: ClipId,
  de: string,
  en: string,
  time: {
    from: number,
    until: number,
  },
}

export const getFlashcard = (
  state: AppState,
  id: ClipId
): ?ExpandedFlashcard => {
  if (!state.clips.byId[id]) return null
  if (!state.clips.byId[id].flashcard) return null
  const flashcard = state.clips.byId[id].flashcard
  const selection = state.clips.byId[id]
  if (!selection) throw new Error('Could not find selection')
  return {
    ...flashcard,
    time: {
      from: getSecondsAtX(state, selection.start),
      until: getSecondsAtX(state, selection.end),
    },
  }
}
export const getCurrentFlashcard = (state: AppState): ?ExpandedFlashcard => {
  const flashcardId = getCurrentFlashcardId(state)
  if (!flashcardId) return null
  return getFlashcard(state, flashcardId)
}

// export const getGerman = (state) => getCurrentFlashcard(state).de
// export const getEnglish = (state) => getCurrentFlashcard(state).en

export const getWaveformSelection = (state: AppState, id: ClipId): ?Clip =>
  state.clips.byId[id]
export const getWaveformSelections = (state: AppState): Array<Clip> =>
  audioSelectors.getWaveformSelectionsOrder(state).map(
    (id: ClipId): Clip => {
      const clip = getWaveformSelection(state, id)
      if (!clip) throw new Error('Impossible')
      return clip
    }
  )
type ExpandedPendingStretch = {
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
}
export const getWaveformPendingStretch = (
  state: AppState
): ?ExpandedPendingStretch => {
  if (!state.clips) return
  const { pendingStretch } = state.user
  if (!pendingStretch) return

  const stretchedSelection = getWaveformSelection(state, pendingStretch.id)
  if (!stretchedSelection)
    throw new Error('Impossible: no stretched selection ' + pendingStretch.id)

  const { originKey } = pendingStretch
  const [start, end] = [
    pendingStretch.end,
    stretchedSelection[originKey],
  ].sort()
  return { id: pendingStretch.id, start, end }
}
export const getWaveform = (state: AppState) => ({
  ...state.waveform,
  ...state.user,
  selections: getWaveformSelections(state),
  pendingStretch: getWaveformPendingStretch(state),
})

export const getCurrentFlashcardId = (state: AppState): ?ClipId =>
  state.user.highlightedSelectionId
export const getFlashcardsByTime = (state: AppState): Array<Flashcard> =>
  audioSelectors.getWaveformSelectionsOrder(state).map(id => {
    const flashcard = getFlashcard(state, id)
    if (!flashcard) throw new Error('flashcard not found ' + id)
    delete flashcard.time
    return flashcard
  })

export const getWaveformPendingSelection = (
  state: AppState
): ?PendingSelection => state.user.pendingSelection
export const getSelectionIdAt = (state: AppState, x: number): ?ClipId =>
  audioSelectors.getWaveformSelectionsOrder(state).find(selectionId => {
    const selection = state.clips.byId[selectionId]
    const { start, end } = selection
    return x >= start && x <= end
  })

export const getPreviousSelectionId = (
  state: AppState,
  id: ClipId
): ?ClipId => {
  const selectionsOrder = audioSelectors.getWaveformSelectionsOrder(state)
  return selectionsOrder[selectionsOrder.indexOf(id) - 1]
}
export const getNextSelectionId = (state: AppState, id: ClipId): ?ClipId => {
  const selectionsOrder = audioSelectors.getWaveformSelectionsOrder(state)
  return selectionsOrder[selectionsOrder.indexOf(id) + 1]
}

export const getSelectionEdgeAt = (state: AppState, x: WaveformX) => {
  const selectionIdAtX = getSelectionIdAt(state, x)
  if (!selectionIdAtX) return null
  const selection = getWaveformSelection(state, selectionIdAtX)
  if (!selection) throw new Error('Impossible')
  const { start, end } = selection
  if (x >= start && x <= start + SELECTION_BORDER_WIDTH)
    return { key: 'start', id: selectionIdAtX }
  if (x >= end - SELECTION_BORDER_WIDTH && x <= end)
    return { key: 'end', id: selectionIdAtX }
}

export const getWaveformViewBoxXMin = (state: AppState) =>
  state.waveform.viewBox.xMin

export const getHighlightedWaveformSelectionId = (state: AppState): ?ClipId =>
  state.user.highlightedSelectionId

type TimeSpan = {
  start: number,
  end: number,
}
export const getClipTimes = (state: AppState, id: ClipId): TimeSpan => {
  const clip = getWaveformSelection(state, id)
  if (!clip) throw new Error('Maybe impossible')
  return {
    start: getSecondsAtX(state, clip.start),
    end: getSecondsAtX(state, clip.end),
  }
}

export const getClipsTimes = (state: AppState): Array<TimeSpan> =>
  audioSelectors
    .getWaveformSelectionsOrder(state)
    .map(id => getClipTimes(state, id))

export const isAudioLoading = (state: AppState): boolean =>
  state.audio.isLoading

export const getMediaFolderLocation = (state: AppState): ?string =>
  state.audio.mediaFolderLocation
