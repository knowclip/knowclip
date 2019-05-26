// @flow
import { getNoteTypeFields, getBlankFlashcard } from '../utils/noteType'

const initialState: ClipsState = {
  byId: {},
  idsByMediaFileId: {},
}

const byStart = clips => (aId, bId) => {
  const { start: a } = clips[aId]
  const { start: b } = clips[bId]
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

const addIdToIdsByMediaFileId = (
  oldById,
  oldIdsByMediaFileId: Array<ClipId>,
  clip
) => {
  return oldIdsByMediaFileId
    .map(id => oldById[id])
    .concat(clip)
    .sort((a, b) => a.start - b.start)
    .map(clip => clip.id)
}

const addIdstoIdsByMediaFileId = (
  oldById,
  oldIdsByMediaFileId: Array<ClipId>,
  sortedClips
) => {
  const newIndex = oldIdsByMediaFileId.findIndex(
    id => oldById[id].start > sortedClips[0].start
  )
  return (newIndex === -1 ? [] : oldIdsByMediaFileId.slice(0, newIndex))
    .concat(sortedClips.map(clip => clip.id))
    .concat(oldIdsByMediaFileId.slice(newIndex))
}

const arrayToMapById = array =>
  array.reduce((all, item) => {
    all[item.id] = item
    return all
  }, {})

const clips: Reducer<ClipsState> = (state = initialState, action) => {
  switch (action.type) {
    case 'CLOSE_PROJECT':
      return initialState

    case 'OPEN_PROJECT': {
      const newState: ClipsState = { byId: {}, idsByMediaFileId: {} }
      const { idsByMediaFileId, byId } = newState
      action.project.mediaFilesMetadata.forEach(({ id }) => {
        idsByMediaFileId[id] = []
      })

      for (const id in action.project.clips) {
        const clip = action.project.clips[id]
        byId[id] = clip
        idsByMediaFileId[clip.fileId].push(clip.id)
      }
      for (const fileId in idsByMediaFileId) {
        idsByMediaFileId[fileId].sort(byStart(byId))
      }
      return newState
    }

    case 'CHOOSE_AUDIO_FILES':
      return {
        ...state,
        idsByMediaFileId: action.ids.reduce(
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
        idsByMediaFileId: {},
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
        idsByMediaFileId: {
          ...state.idsByMediaFileId,
          [fileId]: addIdToIdsByMediaFileId(
            state.byId,
            state.idsByMediaFileId[fileId],
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
        idsByMediaFileId: {
          ...state.idsByMediaFileId,
          [fileId]: addIdstoIdsByMediaFileId(
            state.byId,
            state.idsByMediaFileId[fileId],
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

      const flashcard = getBlankFlashcard(
        finalId,
        state.byId[finalId].flashcard.type,
        [
          ...sortedClipsToMerge.reduce((all, { flashcard: { tags } }) => {
            tags.forEach(tag => all.add(tag))
            return all
          }, new Set()),
        ]
      )

      for (const fieldName in flashcard.fields) {
        const value = sortedClipsToMerge
          .map(({ flashcard: { fields } }) => fields[fieldName])
          .filter(x => x.trim())
          .join('\n')
        flashcard.fields[fieldName] = value
      }

      newClips[finalId] = {
        ...state.byId[finalId],
        start: sortedClipsToMerge[0].start,
        end: sortedClipsToMerge[sortedClipsToMerge.length - 1].end,
        flashcard,
      }
      return {
        ...state,
        byId: newClips,
        idsByMediaFileId: {
          ...state.idsByMediaFileId,
          [fileId]: state.idsByMediaFileId[fileId].filter(
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
        idsByMediaFileId: {
          ...state.idsByMediaFileId,
          [fileId]: state.idsByMediaFileId[fileId].filter(
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
        idsByMediaFileId: {
          ...state.idsByMediaFileId,
          [fileId]: state.idsByMediaFileId[fileId].filter(
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

    case 'ADD_MEDIA_TO_PROJECT': {
      const idsByMediaFileId = { ...state.idsByMediaFileId }
      action.mediaFilePaths.forEach(({ metadata }) => {
        idsByMediaFileId[metadata.id] = []
      })
      return {
        ...state,
        idsByMediaFileId,
      }
    }

    case 'DELETE_MEDIA_FROM_PROJECT': {
      const clipIds = state.idsByMediaFileId[action.mediaFileId] || []
      console.log('mediaFileId', action.mediaFileId)

      const byId = { ...state.byId }
      clipIds.forEach(id => {
        delete byId[id]
      })

      const idsByMediaFileId = { ...state.idsByMediaFileId }
      delete idsByMediaFileId[action.mediaFileId]

      return {
        ...state,
        byId,
        idsByMediaFileId,
      }
    }

    default:
      return state
  }
}

export default clips
