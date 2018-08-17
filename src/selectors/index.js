import { createSelector } from 'reselect'

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
export const getWaveform = (state) => ({
  ...state.waveform,
  // path: getWaveformPath(state),
})
