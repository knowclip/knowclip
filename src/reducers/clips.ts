import { Reducer } from 'redux'
import newFlashcard from '../utils/newFlashcard'
import { getNoteTypeFields } from '../utils/noteType'

const initialState: ClipsState = {
  byId: {},
  idsByMediaFileId: {},
}

const byStart = (clips: Record<ClipId, Clip>) => (aId: ClipId, bId: ClipId) => {
  const { start: a } = clips[aId]
  const { start: b } = clips[bId]
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

const addIdToIdsByMediaFileId = (
  oldById: Record<ClipId, Clip>,
  oldIdsByMediaFileId: Array<ClipId>,
  clip: Clip
) => {
  return oldIdsByMediaFileId
    .map(id => oldById[id])
    .concat(clip)
    .sort((a, b) => a.start - b.start)
    .map(clip => clip.id)
}

const addIdstoIdsByMediaFileId = (
  oldById: Record<ClipId, Clip>,
  oldIdsByMediaFileId: Array<ClipId>,
  sortedClips: Array<Clip>
) => {
  const newIndex = oldIdsByMediaFileId.findIndex(
    id => oldById[id].start > sortedClips[0].start
  )
  return (newIndex === -1 ? [] : oldIdsByMediaFileId.slice(0, newIndex))
    .concat(sortedClips.map(clip => clip.id))
    .concat(oldIdsByMediaFileId.slice(newIndex))
}

const arrayToMapById: (arr: Array<Clip>) => Record<ClipId, Clip> = array =>
  array.reduce(
    (all, item) => {
      all[item.id] = item
      return all
    },
    {} as Record<ClipId, Clip>
  )

const clips: Reducer<ClipsState, Action> = (state = initialState, action) => {
  switch (action.type) {
    case A.CLOSE_PROJECT:
      return initialState

    case A.OPEN_PROJECT: {
      const newState: ClipsState = { byId: {}, idsByMediaFileId: {} }
      const { idsByMediaFileId, byId } = newState
      action.project.mediaFileIds.forEach(id => {
        idsByMediaFileId[id] = []
      })

      for (const clip of action.clips) {
        byId[clip.id] = clip
        idsByMediaFileId[clip.fileId].push(clip.id)
      }
      for (const fileId in idsByMediaFileId) {
        idsByMediaFileId[fileId].sort(byStart(byId))
      }
      return newState
    }

    // case A.CHOOSE_MEDIA_FILES:
    case A.ADD_AND_OPEN_FILE:
      if (action.file.type === 'MediaFile')
        return {
          ...state,
          idsByMediaFileId: {
            [action.file.id]: [],
          },
        }
      return state
    case A.REMOVE_MEDIA_FILES:
      return {
        ...state,
        idsByMediaFileId: {},
        byId: {},
      }

    case A.ADD_CLIP: {
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

    case A.ADD_CLIPS: {
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

    case A.EDIT_CLIP:
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

    case A.MERGE_CLIPS: {
      const { ids } = action // should all have same filepath
      const { fileId } = state.byId[ids[0]]
      const [finalId, ...idsToBeDiscarded] = ids
      const clipsOrder = Object.values(state.byId)
        .sort((a, b) => a.start - b.start)
        .map(s => s.id)
      const newClipsOrder = clipsOrder.filter(
        id => !idsToBeDiscarded.includes(id)
      )
      const newClips: Record<ClipId, Clip> = {}
      newClipsOrder.forEach(id => {
        const clip = state.byId[id]
        if (!clip) throw new Error('impossible')
        newClips[id] = clip
      })
      const sortedClipsToMerge = ids
        .sort(byStart(state.byId))
        .map(id => state.byId[id])

      const flashcard = newFlashcard(
        finalId,
        state.byId[finalId].flashcard.fields,
        [
          ...sortedClipsToMerge.reduce((all, { flashcard: { tags } }) => {
            tags.forEach((tag: string) => all.add(tag))
            return all
          }, new Set<string>()),
        ]
      )
      const fieldNames = getNoteTypeFields(flashcard.type)

      for (const fieldName of fieldNames) {
        const value = sortedClipsToMerge
          // @ts-ignore
          .map(({ flashcard: { fields } }) => fields[fieldName])
          .filter(x => x.trim())
          .join('\n')
        // @ts-ignore
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
      } as ClipsState
    }

    case A.DELETE_CARD: {
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

    case A.DELETE_CARDS: {
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

    case A.SET_FLASHCARD_FIELD: {
      const { id, key, value } = action
      const clip = state.byId[id]
      const card: Flashcard = clip.flashcard

      // @ts-ignore
      const byId: Record<ClipId, Clip> = {
        ...state.byId,
        [id]: {
          ...clip,
          flashcard: {
            ...card,
            fields: { ...card.fields, [key]: value },
          },
        },
      }
      return {
        ...state,
        byId,
      }
    }

    case A.ADD_FLASHCARD_TAG: {
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

    case A.DELETE_FLASHCARD_TAG: {
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

    case A.DELETE_MEDIA_FROM_PROJECT: {
      const clipIds = state.idsByMediaFileId[action.mediaFileId] || []

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
