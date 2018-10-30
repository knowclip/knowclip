const initialState = {}

export default function flashcards(state = initialState, action) {
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

    case 'ADD_WAVEFORM_SELECTION':
      return {
        ...state,
        [action.selection.id]: {
          // should reference user-defined card schema
          de: '',
          en: '',
        }
      }

    case 'DELETE_CARD': {
      const newState = { ...state }
      delete newState[action.id]
      return newState
    }

    default:
      return state
  }
}
