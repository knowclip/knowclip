import { createSelector } from 'reselect'
import { basename } from 'path'

export const WAVEFORM_HEIGHT = 50
export const SELECTION_BORDER_WIDTH = 10
export const SELECTION_THRESHOLD = 40

export const getSecondsAtX = (state, x) => {
  const { stepsPerSecond, stepLength } = state.waveform
  return x / (stepsPerSecond * stepLength)
}
export const getMillisecondsAtX = (state, x) => {
  return 1000 * getSecondsAtX(state, x)
}
export const getXAtMilliseconds = (state, milliseconds) => {
  const { stepsPerSecond, stepLength } = state.waveform
  return (milliseconds / 1000) * (stepsPerSecond * stepLength)
}

// for reference during transition to clip-based flashcards
// export const getCurrentFlashcardId = (state) => state.audio.filenames[state.audio.currentFileIndex]
export const getCurrentFlashcardId = state =>
  state.waveform.highlightedSelectionId
export const getFlashcardsByTime = state =>
  state.waveform.selectionsOrder.map(id => state.flashcards[id])
export const getFlashcard = (state, id) => {
  const flashcard = state.flashcards[id]
  if (!flashcard) return null
  const selection = state.waveform.selections[id]
  return {
    ...flashcard,
    time: {
      from: getSecondsAtX(state, selection.start),
      until: getSecondsAtX(state, selection.end),
    },
  }
}
export const getCurrentFlashcard = state =>
  getFlashcard(state, getCurrentFlashcardId(state))

// export const getGerman = (state) => getCurrentFlashcard(state).de
// export const getEnglish = (state) => getCurrentFlashcard(state).en

export const getFilePaths = state => state.audio.filePaths
export const isLoopOn = state => state.audio.loop
export const areFilesLoaded = state => Boolean(state.audio.filePaths.length)
export const isNextButtonEnabled = state =>
  Boolean(state.audio.filePaths.length > 1) &&
  state.audio.currentFileIndex !== state.audio.filePaths.length - 1
export const isPrevButtonEnabled = state =>
  Boolean(state.audio.filePaths.length > 1) &&
  state.audio.currentFileIndex !== 0
export const getCurrentFileIndex = state => state.audio.currentFileIndex
export const getCurrentFilePath = ({ audio }) =>
  audio.filePaths[audio.currentFileIndex]
export const getCurrentFileName = state => {
  const filePath = getCurrentFilePath(state)
  return filePath && basename(filePath)
}
export const makeGetCurrentFile = createSelector(
  [getCurrentFileIndex],
  currentFileIndex => files => files[currentFileIndex]
)

// export const getWaveformPath = (state) => state.waveform.peaks && getSvgPath(state.waveform.peaks)
export const getWaveformSelection = (state, id) =>
  state.waveform && state.waveform.selections[id]
export const getWaveformSelections = state =>
  state.waveform.selectionsOrder.map(id => getWaveformSelection(state, id))
export const getWaveformPendingStretch = state => {
  if (!state.waveform) return
  const { pendingStretch } = state.waveform
  if (!pendingStretch) return
  const stretchedSelection = getWaveformSelection(state, pendingStretch.id)
  const [start, end] = [
    pendingStretch.end,
    stretchedSelection[pendingStretch.originKey],
  ].sort()
  return { ...pendingStretch, start, end }
}
export const getWaveform = state => ({
  ...state.waveform,
  selections: getWaveformSelections(state),
  pendingStretch: getWaveformPendingStretch(state),
})
export const getWaveformSelectionsOrder = state =>
  state.waveform.selectionsOrder
export const getWaveformPendingSelection = state =>
  state.waveform.pendingSelection
export const getSelectionIdAt = (state, x) => {
  const { waveform } = state
  const { selectionsOrder, selections } = waveform
  return selectionsOrder.find(selectionId => {
    const { start, end } = selections[selectionId]
    return x >= start && x <= end
  })
}

export const getPreviousSelectionId = (state, id) => {
  const { selectionsOrder } = state.waveform
  return selectionsOrder[selectionsOrder.indexOf(id) - 1]
}
export const getNextSelectionId = (state, id) => {
  const { selectionsOrder } = state.waveform
  return selectionsOrder[selectionsOrder.indexOf(id) + 1]
}

export const getSelectionEdgeAt = (state, x) => {
  const selectionIdAtX = getSelectionIdAt(state, x)
  if (!selectionIdAtX) return null
  const { start, end } = getWaveformSelection(state, selectionIdAtX)
  if (x >= start && x <= start + SELECTION_BORDER_WIDTH)
    return { key: 'start', id: selectionIdAtX }
  if (x >= end - SELECTION_BORDER_WIDTH && x <= end)
    return { key: 'end', id: selectionIdAtX }
}

export const getWaveformViewBoxXMin = state => state.waveform.viewBox.xMin

export const getHighlightedWaveformSelectionId = state =>
  state.waveform.highlightedSelectionId

export const getClipTimes = (state, id) => {
  const clip = getWaveformSelection(state, id)
  return {
    start: getSecondsAtX(state, clip.start),
    end: getSecondsAtX(state, clip.end),
  }
}

export const getClipsTimes = state =>
  getWaveformSelectionsOrder(state).map(id => getClipTimes(state, id))
