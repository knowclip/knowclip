const initialState = {
  currentFileIndex: 0,
  flashcards: {},
  filenames: [],
  loop: true,
  waveformPath: null,
}

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case 'INITIALIZE_FLASHCARDS': {
      const { flashcards, filenames } = action

      return {
        ...state,
        flashcards,
        filenames,
        currentFileIndex: 0,
      }
    }

    case 'SET_FLASHCARD_FIELD': {
      const { id, key, value } = action

      return {
        ...state,
        flashcards: {
          ...state.flashcards,
          [id]: {
            ...state.flashcards[id],
            [key]: value,
          },
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
        currentFileIndex: action.index,
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
