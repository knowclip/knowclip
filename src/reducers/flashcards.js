// @flow

const initialState = {}

const flashcards: Reducer<FlashcardsState> = (state = initialState, action) => {
  switch (action.type) {
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
          id: action.selection.id,
        },
      }

    case 'ADD_WAVEFORM_SELECTIONS':
      return {
        ...state,
        ...action.selections.reduce((all: FlashcardsState, selection: Clip) => {
          all[selection.id] = {
            // should reference user-defined card schema
            de: '',
            en: '',
            id: selection.id,
          }
          return all
        }, ({}: FlashcardsState)),
      }
    case 'DELETE_CARD': {
      const newState = { ...state }
      delete newState[action.id]
      return newState
    }

    case 'DELETE_CARDS': {
      const newState = { ...state }
      action.ids.forEach(id => {
        delete newState[id]
      })
      return newState
    }

    default:
      return state
  }
}

export default flashcards
