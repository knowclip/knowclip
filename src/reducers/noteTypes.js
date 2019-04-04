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
export const initialState: Exact<NoteTypesState> = {
  byId: {
    default: {
      id: 'default',
      name: 'default',
      fields: [{ id: 'front', name: 'Front' }, { id: 'back', name: 'Back' }],
      useTagsField: true,
    },
  },
  allIds: ['default'],
}
const noteTypes: Reducer<NoteTypesState> = (state = initialState, action) => {
  switch (action.type) {
    case 'OPEN_PROJECT':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.project.noteType.id]: action.project.noteType,
        },
        allIds: [...state.allIds, action.project.noteType.id],
      }
    case 'ADD_NOTE_TYPE':
    case 'CREATE_PROJECT':
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
          }
        : initialState
    }

    default:
      return state
  }
}

export default noteTypes
