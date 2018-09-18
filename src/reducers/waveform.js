import * as s from '../selectors'

const initialState = {
  stepsPerSecond: 25,
  stepLength: 2,
  path: null,
  cursor: { x: 0, y: 0 },
  viewBox: { xMin: 0 },
  selectionsOrder: [],
  selections: {},
  pendingSelection: null,
  pendingStretch: null,
  peaks: [],
  highlightedSelection: null,
}

const byStart = ({ start: a }, { start: b }) => {
  if (a < b) return -1
  if (a === b) return 0
  if (a > b) return 1
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
        ].sort(byStart),
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

    case 'EDIT_WAVEFORM_SELECTION':
      return {
        ...state,
        selections: {
          ...state.selections,
          [action.id]: {
            ...state.selections[action.id],
            // START AND END SHOULD ALWAYS BE SORTED!
            ...action.override,
          },
        },
      }

    case 'SET_WAVEFORM_PENDING_STRETCH':
      return {
        ...state,
        pendingStretch: action.stretch,
      }

    case 'MERGE_WAVEFORM_SELECTIONS': {
      const { id1, id2 } = action
      const { selections } = state
      const selection1 = selections[id1]
      const selection2 = selections[id2]

      const { [id2]: deleted, ...rest } = selections
      const [firstSelection, secondSelection] = [selection1, selection2].sort(byStart)
      return {
        ...state,
        selectionsOrder: state.selectionsOrder.filter(id => id !== id2),
        selections: {
          ...rest,
          [id1]: {
            ...selections[id1],
            start: firstSelection.start,
            end: secondSelection.end,
          }
        }
      }
    }

    default:
      return state
  }
}
