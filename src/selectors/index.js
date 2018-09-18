import { createSelector } from 'reselect'

export const WAVEFORM_HEIGHT = 50
export const SELECTION_BORDER_WIDTH = 10
export const SELECTION_THRESHOLD = 40

export const getCurrentFlashcardId = (state) => state.audio.filenames[state.audio.currentFileIndex]
export const getFlashcards = (state) => state.flashcards
export const getFlashcard = (state, id) => state.flashcards[id]
export const getCurrentFlashcard = (state) => getFlashcard(state, getCurrentFlashcardId(state))

// export const getGerman = (state) => getCurrentFlashcard(state).de
// export const getEnglish = (state) => getCurrentFlashcard(state).en

export const getFilenames = (state) => state.audio.filenames
export const isLoopOn = (state) => state.audio.loop
export const areFilesLoaded = (state) => Boolean(state.audio.filenames.length)
export const isNextButtonEnabled = (state) => state.audio.currentFileIndex === state.audio.filenames.length - 1
export const isPrevButtonEnabled = (state) => state.audio.currentFileIndex === 0
export const getCurrentFileIndex = (state) => state.audio.currentFileIndex
export const makeGetCurrentFile = createSelector(
  [getCurrentFileIndex],
  (currentFileIndex) => (files) => files[currentFileIndex]
)


// export const getWaveformPath = (state) => state.waveform.peaks && getSvgPath(state.waveform.peaks)
export const getWaveformSelection = (state, id) => state.waveform.selections[id]
export const getWaveformSelections = (state) => state.waveform.selectionsOrder.map(id => getWaveformSelection(state, id))
export const getWaveformPendingStretch = (state) => {
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
export const getWaveform = (state) => ({
  ...state.waveform,
  selections: getWaveformSelections(state),
  pendingStretch: getWaveformPendingStretch(state),
})
export const getWaveformPendingSelection = (state) => state.waveform.pendingSelection
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
  if (x >= start && x <= start + SELECTION_BORDER_WIDTH) return { key: 'start', id: selectionIdAtX }
  if (x >= end - SELECTION_BORDER_WIDTH && x <= end) return { key: 'end', id: selectionIdAtX }
}

export const getWaveformViewBoxXMin = (state) => state.waveform.viewBox.xMin

// make like others
export const getTimeAtX = (x, { stepsPerSecond, stepLength }) => x / (stepsPerSecond * stepLength)
