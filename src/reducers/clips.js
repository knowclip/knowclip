// @flow
const initialState: ClipsState = {
  byId: {},
  idsForFile: {},
}

const byStart = clips => (aId, bId) => {
  const { start: a } = clips[aId]
  const { start: b } = clips[bId]
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

const clips: Reducer<ClipsState> = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_WAVEFORM_SELECTION':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.selection.id]: action.selection,
        },
      }

    case 'ADD_WAVEFORM_SELECTIONS':
      return {
        ...state,
        byId: {
          ...state.byId,
          ...action.selections.reduce((all, selection) => {
            all[selection.id] = selection
            return all
          }, {}),
        },
      }

    case 'EDIT_WAVEFORM_SELECTION':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.id]: {
            ...state[action.id],
            // START AND END SHOULD ALWAYS BE SORTED! where is the right place to do this?
            ...action.override,
          },
        },
      }

    case 'MERGE_WAVEFORM_SELECTIONS': {
      const { ids } = action
      const [finalId, ...idsToBeDiscarded] = ids
      const selectionsOrder: Array<ClipId> = (Object.values(state.byId): any)
        .sort((a: Clip, b: Clip) => a.start - b.start)
        .map(s => s.id)
      const newSelectionsOrder: Array<ClipId> = selectionsOrder.filter(
        id => !idsToBeDiscarded.includes(id)
      )
      const newSelections: { [ClipId]: Clip } = {}
      newSelectionsOrder.forEach(id => {
        const selection = state.byId[id]
        if (!selection) throw new Error('impossible')
        newSelections[id] = selection
      })
      const sortedSelectionsToMerge = ids
        .sort(byStart(state.byId))
        .map(id => state.byId[id])
      newSelections[finalId] = {
        ...state.byId[finalId],
        start: sortedSelectionsToMerge[0].start,
        end: sortedSelectionsToMerge[sortedSelectionsToMerge.length - 1].end,
      }
      return {
        ...state,
        byId: newSelections,
      }
    }

    case 'DELETE_CARD': {
      const { id } = action
      const byId = { ...state.byId }
      delete byId[id]
      return {
        ...state,
        byId,
      }
    }

    case 'DELETE_CARDS': {
      const byId = { ...state.byId }
      action.ids.forEach(id => {
        delete byId[id]
      })
      return {
        ...state,
        byId,
      }
    }

    case 'SET_FLASHCARD_FIELD': {
      const { id, key, value } = action

      return {
        ...state,
        byId: {
          ...state.byId,
          [id]: {
            ...state.byId[id],
            flashcard: {
              ...state.byId[id].flashcard,
              [key]: value,
            },
          },
        },
      }
    }

    default:
      return state
  }
}

export default clips
