import { createSelector } from 'reselect'

export const getCurrentFileIndex = (state) => state.currentFileIndex
export const getCurrentFlashcardId = (state) => state.filenames[state.currentFileIndex]
export const makeGetCurrentFile = createSelector(
  [getCurrentFileIndex],
  (currentFileIndex) => (files) => files[currentFileIndex]
)

export const getFlashcards = (state) => state.flashcards

export const getCurrentFlashcard = createSelector(
  [getFlashcards, getCurrentFlashcardId],
  (flashcards, currentFlashcardId) => flashcards[currentFlashcardId],
)


// export const getGerman = (state) => getCurrentFlashcard(state).de
// export const getEnglish = (state) => getCurrentFlashcard(state).en

export const areFilesLoaded = (state) => Boolean(state.filenames.length)
export const isNextButtonEnabled = (state) => state.currentFileIndex === state.filenames.length - 1
export const isPrevButtonEnabled = (state) => state.currentFileIndex === 0
export const isModalOpen = (state) => state.modalIsOpen

export const isLoopOn = (state) => state.loop

export const getWaveformPath = (state) => state.waveformPath
