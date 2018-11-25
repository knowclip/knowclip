// @flow
const initialState: ClipsState = {}

const byStart = selections => (aId, bId) => {
  const { start: a } = selections[aId]
  const { start: b } = selections[bId]
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

const clips: Reducer<ClipsState> = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_WAVEFORM_SELECTION':
      return {
        ...state,
        [action.selection.id]: action.selection,
      }

    case 'EDIT_WAVEFORM_SELECTION':
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          // START AND END SHOULD ALWAYS BE SORTED! where is the right place to do this?
          ...action.override,
        },
      }

    case 'MERGE_WAVEFORM_SELECTIONS': {
      const { ids } = action
      const [finalId, ...idsToBeDiscarded] = ids
      const selectionsOrder: Array<ClipId> = (Object.values(state): any)
        .sort((a: Clip, b: Clip) => a.start - b.start)
        .map(s => s.id)
      const newSelectionsOrder: Array<ClipId> = selectionsOrder.filter(
        id => !idsToBeDiscarded.includes(id)
      )
      const newSelections: { [ClipId]: Clip } = {}
      newSelectionsOrder.forEach(id => {
        const selection = state[id]
        if (!selection) throw new Error('impossible')
        newSelections[id] = selection
      })
      const sortedSelectionsToMerge = ids
        .sort(byStart(state))
        .map(id => state[id])
      newSelections[finalId] = {
        ...state[finalId],
        start: sortedSelectionsToMerge[0].start,
        end: sortedSelectionsToMerge[sortedSelectionsToMerge.length - 1].end,
      }
      return newSelections
    }

    case 'DELETE_CARD': {
      const { id } = action
      const selections = { ...state }
      delete selections[id]
      return selections
    }

    default:
      return state
  }
}

export default clips
