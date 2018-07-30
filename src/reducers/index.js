const initialState = {
  currentFileIndex: 0,
  flashcards: {},
  loop: true,
  waveformPath: null,
}

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case 'INITIALIZE_FLASHCARDS': {
      const { flashcards } = action

      return {
        ...state,
        flashcards,
        currentFileIndex: 0,
      }
    }

    case 'SET_FLASHCARD_FIELD': {
      const { id, value } = action

      return {
        ...state,
        flashcards: {
          ...state.flashcards,
          [id]: value,
        },
      }
    }

    case 'SET_WAVEFORM_PATH':
      return {
        ...state,
        waveformPath: action.path,
      }

    case 'SET_CURRENT_FLASHCARD':
      return {
        ...state,
        currentFlashcardIndex: action.index,
      }

    case 'TOGGLE_LOOP':
      return {
        ...state,
        loop: !state.loop,
      }

    default:
      return state
  }
}
