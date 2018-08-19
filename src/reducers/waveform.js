
const initialState = {
  stepsPerSecond: 25,
  stepLength: 2,
  path: null,
  cursor: { x: 0, y: 0 },
  viewBox: { xMin: 0 },
  selectionsOrder: [],
  selections: {},
  pendingSelection: null,
  peaks: [],
  highlightedSelection: null,
}

export default function waveform(state = initialState, action) {
  switch (action.type) {
    case 'SET_WAVEFORM_PEAKS':
      return {
        ...state,
        peaks: action.peaks || [],
      }

    case 'SET_CURSOR_POSITION': {
      return {
        ...state,
        cursor: {
          ...state.cursor,
          x: action.x,
        },
        viewBox: action.newViewBox || state.viewBox,
      }
    }

    case 'ADD_WAVEFORM_SELECTION':
      return {
        ...state,
        pendingSelection: null,
        selections: {
          ...state.selections,
          [action.selection.id]: action.selection,
        },
        selectionsOrder: [
          ...state.selectionsOrder,
          action.selection.id,
        ], // wrong!!!!!
      }

    case 'SET_WAVEFORM_PENDING_SELECTION':
      return {
        ...state,
        pendingSelection: action.selection,
      }

    case 'HIGHLIGHT_WAVEFORM_SELECTION':
      return {
        ...state,
        highlightedSelection: action.id,
      }

    default:
      return state
  }
}
