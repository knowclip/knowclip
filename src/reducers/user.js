// @flow

const initialState: UserState = {
  pendingSelection: null,
  pendingStretch: null,
  highlightedSelectionId: null,
  noteTypes: [],
  noteTypeAssignments: {},
}

export default function user(
  state: UserState = initialState,
  action: Object
): UserState {
  switch (action.type) {
    case 'ADD_WAVEFORM_SELECTION': {
      return {
        ...state,
        pendingSelection: null,
      }
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

    default:
      return state
  }
}
