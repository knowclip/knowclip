// @flow

// const initialState: NoteTypesState = {
//   byId: {
//     default: {
//       id: 'default',
//       name: 'default',
//       fields: [{ id: 'front', name: 'Front' }, { id: 'back', name: 'Back' }],
//     },
//   },
//   allIds: ['default'],
//   defaultId: 'default',
// }
export const initialState: NoteTypesState = {
  byId: {
    default: {
      id: 'default',
      name: 'default',
      fields: [{ id: 'front', name: 'Front' }, { id: 'back', name: 'Back' }],
    },
  },
  allIds: ['default'],
  defaultId: 'default',
}
const noteTypes: Reducer<NoteTypesState> = (state = initialState, action) => {
  switch (action.type) {
    case 'HYDRATE_FROM_PROJECT_FILE':
      return action.state.noteTypes

    case 'ADD_NOTE_TYPE':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.noteType.id]: action.noteType,
        },
        allIds: [...state.allIds, action.noteType.id],
      }

    case 'EDIT_NOTE_TYPE':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.id]: {
            ...state.byId[action.id],
            ...action.override,
          },
        },
      }

    case 'DELETE_NOTE_TYPE': {
      const byId = { ...state.byId }
      delete byId[action.id]
      const leftoverIds = Object.keys(byId)
      return leftoverIds.length
        ? {
            byId,
            allIds: state.allIds.filter(id => id !== action.id),
            defaultId:
              state.defaultId === action.id ? leftoverIds[0] : state.defaultId,
          }
        : initialState
    }

    case 'SET_DEFAULT_NOTE_TYPE':
      return {
        ...state,
        defaultId: action.id,
      }

    default:
      return state
  }
}

export default noteTypes
