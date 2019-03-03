// @flow
const initialState: ClipsState = {
  byId: {},
  idsByFilePath: {},
}

const byStart = clips => (aId, bId) => {
  const { start: a } = clips[aId]
  const { start: b } = clips[bId]
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

const addIdToIdsByFilePath = (
  oldById,
  oldIdsByFilepath: Array<ClipId>,
  clip
) => {
  return oldIdsByFilepath
    .map(id => oldById[id])
    .concat(clip)
    .sort((a, b) => a.start - b.start)
    .map(clip => clip.id)
}

const addIdstoIdsByFilePath = (
  oldById,
  oldIdsByFilepath: Array<ClipId>,
  sortedClips
) => {
  const newIndex = oldIdsByFilepath.findIndex(
    id => oldById[id].start > sortedClips[0].start
  )
  return (newIndex === -1 ? [] : oldIdsByFilepath.slice(0, newIndex))
    .concat(sortedClips.map(clip => clip.id))
    .concat(oldIdsByFilepath.slice(newIndex))
}

const arrayToMapById = array =>
  array.reduce((all, item) => {
    all[item.id] = item
    return all
  }, {})

const clips: Reducer<ClipsState> = (state = initialState, action) => {
  switch (action.type) {
    case 'HYDRATE_FROM_PROJECT_FILE':
      return action.state.clips

    case 'CHOOSE_AUDIO_FILES':
      return {
        ...state,
        idsByFilePath: action.filePaths.reduce(
          (all, filePath) => ({
            ...all,
            [filePath]: [],
          }),
          {}
        ),
      }

    case 'REMOVE_AUDIO_FILES':
      return {
        ...state,
        idsByFilePath: {},
        byId: {},
      }

    case 'ADD_CLIP': {
      const { clip } = action
      const { filePath } = clip
      return {
        ...state,
        byId: {
          ...state.byId,
          [clip.id]: clip,
        },
        idsByFilePath: {
          ...state.idsByFilePath,
          [filePath]: addIdToIdsByFilePath(
            state.byId,
            state.idsByFilePath[filePath],
            clip
          ),
        },
      }
    }

    case 'ADD_CLIPS': {
      const { clips, filePath } = action
      return {
        ...state,
        byId: {
          ...state.byId,
          ...arrayToMapById(clips),
        },
        idsByFilePath: {
          ...state.idsByFilePath,
          [filePath]: addIdstoIdsByFilePath(
            state.byId,
            state.idsByFilePath[filePath],
            clips
          ),
        },
      }
    }

    case 'EDIT_CLIP':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.id]: {
            ...state.byId[action.id],
            // START AND END SHOULD ALWAYS BE SORTED! where is the right place to do this?
            ...action.override,
          },
        },
      }

    case 'MERGE_CLIPS': {
      const { ids } = action // should all have same filepath
      const { filePath } = state.byId[ids[0]]
      const [finalId, ...idsToBeDiscarded] = ids
      const clipsOrder: Array<ClipId> = (Object.values(state.byId): any)
        .sort((a: Clip, b: Clip) => a.start - b.start)
        .map(s => s.id)
      const newClipsOrder: Array<ClipId> = clipsOrder.filter(
        id => !idsToBeDiscarded.includes(id)
      )
      const newClips: { [ClipId]: Clip } = {}
      newClipsOrder.forEach(id => {
        const clip = state.byId[id]
        if (!clip) throw new Error('impossible')
        newClips[id] = clip
      })
      const sortedClipsToMerge = ids
        .sort(byStart(state.byId))
        .map(id => state.byId[id])
      newClips[finalId] = {
        ...state.byId[finalId],
        start: sortedClipsToMerge[0].start,
        end: sortedClipsToMerge[sortedClipsToMerge.length - 1].end,
      }
      return {
        ...state,
        byId: newClips,
        idsByFilePath: {
          ...state.idsByFilePath,
          [filePath]: state.idsByFilePath[filePath].filter(
            id => !idsToBeDiscarded.includes(id)
          ),
        },
      }
    }

    case 'DELETE_CARD': {
      const { id } = action
      const { filePath } = state.byId[id]
      const byId = { ...state.byId }
      delete byId[id]
      return {
        ...state,
        byId,
        idsByFilePath: {
          ...state.idsByFilePath,
          [filePath]: state.idsByFilePath[filePath].filter(
            id => id !== action.id
          ),
        },
      }
    }

    case 'DELETE_CARDS': {
      const { ids } = action
      const byId = { ...state.byId }
      if (!ids.length) return state

      const { filePath } = state.byId[ids[0]]
      action.ids.forEach(id => {
        delete byId[id]
      })
      return {
        ...state,
        byId,
        idsByFilePath: {
          ...state.idsByFilePath,
          [filePath]: state.idsByFilePath[filePath].filter(
            id => !ids.includes(id)
          ),
        },
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
              fields: { ...state.byId[id].flashcard.fields, [key]: value },
            },
          },
        },
      }
    }

    case 'SET_FLASHCARD_TAGS_TEXT': {
      const { id, value } = action

      return {
        ...state,
        byId: {
          ...state.byId,
          [id]: {
            ...state.byId[id],
            flashcard: {
              ...state.byId[id].flashcard,
              tags: value,
            },
          },
        },
      }
    }

    case 'ADD_FLASHCARD_TAG': {
      const { id, text } = action

      return {
        ...state,
        byId: {
          ...state.byId,
          [id]: {
            ...state.byId[id],
            flashcard: {
              ...state.byId[id].flashcard,
              tags: [
                ...(state.byId[id].flashcard.tags || []),
                text.replace(/\s/g, '_'),
              ],
            },
          },
        },
      }
    }

    case 'DELETE_FLASHCARD_TAG': {
      const { id, index } = action
      const newTags = [...state.byId[id].flashcard.tags]
      newTags.splice(index, 1)

      return {
        ...state,
        byId: {
          ...state.byId,
          [id]: {
            ...state.byId[id],
            flashcard: {
              ...state.byId[id].flashcard,
              tags: newTags,
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
