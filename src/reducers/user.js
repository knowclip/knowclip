// @flow

const initialState: UserState = {
  pendingSelection: null,
  pendingStretch: null,
  highlightedSelectionId: null,
  defaultNoteTypeId: 'default',
  defaultTags: [],
}

const user: Reducer<UserState> = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_WAVEFORM_SELECTION':
      return {
        ...state,
        pendingSelection: null,
      }

    case 'SET_WAVEFORM_PENDING_SELECTION':
      return {
        ...state,
        pendingSelection: action.selection,
      }

    case 'HIGHLIGHT_WAVEFORM_SELECTION':
      return {
        ...state,
        highlightedSelectionId: action.id,
      }

    case 'SET_WAVEFORM_PENDING_STRETCH':
      return {
        ...state,
        pendingStretch: action.stretch,
      }

    case 'SET_DEFAULT_TAGS':
      return {
        ...state,
        defaultTags: action.tags,
      }

    default:
      return state
  }
}

export default user
