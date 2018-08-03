const initialState = {
  loop: true,
  currentFileIndex: 0,
  filenames: [],
}

export default function audio(state = initialState, action) {
  switch (action.type) {
    case 'TOGGLE_LOOP':
      return {
        ...state,
        loop: !state.loop,
      }

    case 'INITIALIZE_FLASHCARDS': {
      const { flashcards, filenames } = action

      return {
        ...state,
        filenames,
        currentFileIndex: 0,
      }
    }

    case 'SET_CURRENT_FILE':
      return {
        ...state,
        currentFileIndex: action.index,
      }

    default:
      return state
  }
}
