// @flow

const initialState: ClipsState = {
  selectionsOrder: [],
  selections: {},
  pendingSelection: null,
  pendingStretch: null,
  highlightedSelectionId: null,
}

const byStart = selections => (aId, bId) => {
  const { start: a } = selections[aId]
  const { start: b } = selections[bId]
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export default function clips(
  state: ClipsState = initialState,
  action: Object
): ClipsState {
  switch (action.type) {
    case 'ADD_WAVEFORM_SELECTION': {
      const selections = {
        ...state.selections,
        [action.selection.id]: action.selection,
      }
      return {
        ...state,
        pendingSelection: null,
        selections,
        selectionsOrder: [...state.selectionsOrder, action.selection.id].sort(
          byStart(selections)
        ),
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

    case 'EDIT_WAVEFORM_SELECTION':
      return {
        ...state,
        selections: {
          ...state.selections,
          [action.id]: {
            ...state.selections[action.id],
            // START AND END SHOULD ALWAYS BE SORTED! where is the right place to do this?
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
      const { ids } = action
      const [finalId, ...idsToBeDiscarded] = ids
      const { selections, selectionsOrder } = state
      const newSelectionsOrder: Array<ClipId> = selectionsOrder.filter(
        id => !idsToBeDiscarded.includes(id)
      )
      const newSelections: { [ClipId]: Clip } = {}
      newSelectionsOrder.forEach(id => {
        const selection = selections[id]
        if (!selection) throw new Error('impossible')
        newSelections[id] = selection
      })
      const sortedSelectionsToMerge = ids
        .sort(byStart(selections))
        .map(id => selections[id])
      newSelections[finalId] = {
        ...selections[finalId],
        start: sortedSelectionsToMerge[0].start,
        end: sortedSelectionsToMerge[sortedSelectionsToMerge.length - 1].end,
      }
      return {
        ...state,
        selectionsOrder: newSelectionsOrder,
        selections: newSelections,
      }
    }

    case 'DELETE_CARD': {
      const { id } = action
      const {
        selections: oldSelections,
        selectionsOrder,
        highlightedSelectionId,
      } = state
      const selections = { ...oldSelections }
      delete selections[id]
      return {
        ...state,
        highlightedSelectionId:
          highlightedSelectionId === id ? null : highlightedSelectionId,
        selections,
        selectionsOrder: selectionsOrder.filter(x => x !== id),
      }
    }

    default:
      return state
  }
}
