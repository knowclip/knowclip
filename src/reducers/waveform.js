import getViewbox from '../utils/getWaveformViewbox'

const initialState = {
  path: null,
  cursor: { x: 0, y: 0 },
  viewbox: getViewbox(),
  selections: [],
  pendingSelection: null,
}

export default function waveform(state = initialState, action) {
  switch (action.type) {
    case 'SET_WAVEFORM_PATH':
      return {
        ...state,
        path: action.path,
      }

    case 'SET_CURSOR_POSITION':
      return {
        ...state,
        cursor: {
          ...state.cursor,
          x: action.x,
        }
      }

    case 'ADD_WAVEFORM_SELECTION':
      return {
        ...state,
        pendingSelection: null,
        selections: [
          ...state.selections,
          state.pendingSelection,
        ]
      }

    case 'SET_WAVEFORM_PENDING_SELECTION':
      return {
        ...state,
        pendingSelection: action.selection,
      }

    default:
      return state
  }
}
