const getCurrentFile = (state, files) => files[state.currentFileIndex]

const getCurrentFlashcard = (state, files) => {
  const currentFile = getCurrentFile(state, files)
  return {
    ...state.flashcardsData[currentFile.name]
    file: currentFile,
  }
}

const getGerman = (state) => getCurrentFlashcard(state).de
const getEnglish = (state) => getCurrentFlashcard(state).en

const areFilesLoaded = (state, files) => Boolean(files.length)
const isNextButtonEnabled = (state, files) => state.currentFileIndex === files.length - 1
const isPrevButtonEnabled = (state) => state.currentFileIndex === 0
const isModalOpen = (state) => state.modalIsOpen
