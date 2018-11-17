// @flow
import { createSelector } from 'reselect'
import { basename } from 'path'

export const WAVEFORM_HEIGHT = 50
export const SELECTION_BORDER_WIDTH = 10
export const SELECTION_THRESHOLD = 40

export const getSecondsAtX = (state: AppState, x: number): number => {
  const { stepsPerSecond, stepLength } = state.waveform
  return x / (stepsPerSecond * stepLength)
}
export const getMillisecondsAtX = (state: AppState, x: number): number => {
  return 1000 * getSecondsAtX(state, x)
}
export const getXAtMilliseconds = (
  state: AppState,
  milliseconds: number
): number => {
  const { stepsPerSecond, stepLength } = state.waveform
  return (milliseconds / 1000) * (stepsPerSecond * stepLength)
}

type FlashcardWithTime = {
  id: FlashcardId,
  de: string,
  en: string,
  time: {
    from: number,
    until: number,
  },
}

export const getFlashcard = (
  state: AppState,
  id: FlashcardId
): ?FlashcardWithTime => {
  const flashcard = state.flashcards[id]
  if (!flashcard) return null
  const selection = state.clips[id]
  return {
    ...flashcard,
    time: {
      from: getSecondsAtX(state, selection.start),
      until: getSecondsAtX(state, selection.end),
    },
  }
}
export const getCurrentFlashcard = (state: AppState): ?FlashcardWithTime => {
  const flashcardId = getCurrentFlashcardId(state)
  if (!flashcardId) return null
  return getFlashcard(state, flashcardId)
}

// export const getGerman = (state) => getCurrentFlashcard(state).de
// export const getEnglish = (state) => getCurrentFlashcard(state).en

export const getFilePaths = (state: AppState) => state.audio.filesOrder
export const isLoopOn = (state: AppState) => state.audio.loop
export const areFilesLoaded = (state: AppState) =>
  Boolean(state.audio.filesOrder.length)
export const isNextButtonEnabled = (state: AppState) =>
  Boolean(state.audio.filesOrder.length > 1) &&
  state.audio.currentFileIndex !== state.audio.filesOrder.length - 1
export const isPrevButtonEnabled = (state: AppState) =>
  Boolean(state.audio.filesOrder.length > 1) &&
  state.audio.currentFileIndex !== 0
export const getCurrentFileIndex = (state: AppState) =>
  state.audio.currentFileIndex
export const getCurrentFileName = (state: AppState) => {
  const filePath = getCurrentFilePath(state)
  return filePath && basename(filePath)
}
export const makeGetCurrentFile = createSelector(
  [getCurrentFileIndex],
  currentFileIndex => files => files[currentFileIndex]
)

// export const getWaveformPath = (state) => state.waveform.peaks && getSvgPath(state.waveform.peaks)

const byStart = selections => (aId, bId) => {
  const { start: a } = selections[aId]
  const { start: b } = selections[bId]
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
export const getCurrentFilePath = ({ audio }: AppState) =>
  audio.filesOrder[audio.currentFileIndex]

export const getCurrentFile = (state: AppState): ?AudioFileData => {
  const currentFilePath = getCurrentFilePath(state)
  return currentFilePath ? state.audio.files[currentFilePath] : null
}
export const getWaveformSelectionsOrder: (
  state: AppState
) => Array<ClipId> = createSelector(
  [state => state.clips, getCurrentFilePath],
  (clips, currentFilePath) => {
    if (!currentFilePath) return []
    const clipsArray = (Object.values(clips): any).filter(
      c => c.filePath === currentFilePath
    )
    return clipsArray
      .sort((a: Clip, b: Clip) => a.start - b.start)
      .map((s: Clip) => s.id)
  }
)

export const getWaveformSelection = (state: AppState, id: ClipId): ?Clip =>
  state.clips[id]
export const getWaveformSelections = (state: AppState): Array<Clip> =>
  getWaveformSelectionsOrder(state).map(
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
  if (!stretchedSelection) throw new Error('Impossible')

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
// export const getWaveformSelectionsOrder = (state: AppState): Array<ClipId> =>
//   state.clips.selectionsOrder

export const getCurrentFlashcardId = (state: AppState): ?FlashcardId =>
  state.user.highlightedSelectionId
export const getFlashcardsByTime = (state: AppState): Array<Flashcard> =>
  getWaveformSelectionsOrder(state).map(id => state.flashcards[id])

export const getWaveformPendingSelection = (
  state: AppState
): ?PendingSelection => state.user.pendingSelection
export const getSelectionIdAt = (state: AppState, x: number): ?ClipId =>
  getWaveformSelectionsOrder(state).find(selectionId => {
    const selection = state.clips[selectionId]
    const { start, end } = selection
    return x >= start && x <= end
  })

export const getPreviousSelectionId = (
  state: AppState,
  id: ClipId
): ?ClipId => {
  const selectionsOrder = getWaveformSelectionsOrder(state)
  return selectionsOrder[selectionsOrder.indexOf(id) - 1]
}
export const getNextSelectionId = (state: AppState, id: ClipId): ?ClipId => {
  const selectionsOrder = getWaveformSelectionsOrder(state)
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
  getWaveformSelectionsOrder(state).map(id => getClipTimes(state, id))
