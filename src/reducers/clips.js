// @flow
const initialState: ClipsState = {
  byId: {},
  idsByAudioFileId: {},
}

const byStart = clips => (aId, bId) => {
  const { start: a } = clips[aId]
  const { start: b } = clips[bId]
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

const addIdToIdsByAudioFileId = (
  oldById,
  oldIdsByAudioFileId: Array<ClipId>,
  clip
) => {
  return oldIdsByAudioFileId
    .map(id => oldById[id])
    .concat(clip)
    .sort((a, b) => a.start - b.start)
    .map(clip => clip.id)
}

const addIdstoIdsByAudioFileId = (
  oldById,
  oldIdsByAudioFileId: Array<ClipId>,
  sortedClips
) => {
  const newIndex = oldIdsByAudioFileId.findIndex(
    id => oldById[id].start > sortedClips[0].start
  )
  return (newIndex === -1 ? [] : oldIdsByAudioFileId.slice(0, newIndex))
    .concat(sortedClips.map(clip => clip.id))
    .concat(oldIdsByAudioFileId.slice(newIndex))
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
        idsByAudioFileId: action.ids.reduce(
          (all, id) => ({
            ...all,
            [id]: [],
          }),
          {}
        ),
      }

    case 'REMOVE_AUDIO_FILES':
      return {
        ...state,
        idsByAudioFileId: {},
        byId: {},
      }

    case 'ADD_CLIP': {
      const { clip } = action
      const { fileId } = clip
      return {
        ...state,
        byId: {
          ...state.byId,
          [clip.id]: clip,
        },
        idsByAudioFileId: {
          ...state.idsByAudioFileId,
          [fileId]: addIdToIdsByAudioFileId(
            state.byId,
            state.idsByAudioFileId[fileId],
            clip
          ),
        },
      }
    }

    case 'ADD_CLIPS': {
      const { clips, fileId } = action
      return {
        ...state,
        byId: {
          ...state.byId,
          ...arrayToMapById(clips),
        },
        idsByAudioFileId: {
          ...state.idsByAudioFileId,
          [fileId]: addIdstoIdsByAudioFileId(
            state.byId,
            state.idsByAudioFileId[fileId],
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
      const { fileId } = state.byId[ids[0]]
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
        idsByAudioFileId: {
          ...state.idsByAudioFileId,
          [fileId]: state.idsByAudioFileId[fileId].filter(
            id => !idsToBeDiscarded.includes(id)
          ),
        },
      }
    }

    case 'DELETE_CARD': {
      const { id } = action
      const { fileId } = state.byId[id]
      const byId = { ...state.byId }
      delete byId[id]
      return {
        ...state,
        byId,
        idsByAudioFileId: {
          ...state.idsByAudioFileId,
          [fileId]: state.idsByAudioFileId[fileId].filter(
            id => id !== action.id
          ),
        },
      }
    }

    case 'DELETE_CARDS': {
      const { ids } = action
      const byId = { ...state.byId }
      if (!ids.length) return state

      const { fileId } = state.byId[ids[0]]
      action.ids.forEach(id => {
        delete byId[id]
      })
      return {
        ...state,
        byId,
        idsByAudioFileId: {
          ...state.idsByAudioFileId,
          [fileId]: state.idsByAudioFileId[fileId].filter(
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
