const initialState = {}

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case 'INITIALIZE_FLASHCARDS':
      return action.flashcards

    case 'SET_FLASHCARD_FIELD': {
      const { id, key, value } = action

      return {
        ...state,
        [id]: {
          ...state[id],
          [key]: value,
        },
      }
    }

    default:
      return state
  }
}
