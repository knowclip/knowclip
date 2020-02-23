import { Reducer } from 'redux'
import newFlashcard from '../utils/newFlashcard'
import { getNoteTypeFields } from '../utils/noteType'
import { arrayToMapById } from '../utils/arrayToMapById'
import { TransliterationFlashcardFields } from '../types/Project'

const initialState: ClipsState = {
  byId: {},
  idsByMediaFileId: {},
  flashcards: {},
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

const clips: Reducer<ClipsState, Action> = (state = initialState, action) => {
  switch (action.type) {
    case A.CLOSE_PROJECT:
      return initialState

    case A.OPEN_PROJECT: {
      const newState: ClipsState = {
        byId: {},
        idsByMediaFileId: {},
        flashcards: action.flashcards,
      }
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

    case A.ADD_FILE:
    case A.OPEN_FILE_REQUEST:
      if (action.file.type === 'MediaFile')
        return state.idsByMediaFileId[action.file.id]
          ? state
          : {
              ...state,
              idsByMediaFileId: {
                ...state.idsByMediaFileId,
                [action.file.id]: [],
              },
            }
      return state

    case A.ADD_CLIP: {
      const { clip, flashcard } = action
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
        flashcards: {
          ...state.flashcards,
          [clip.id]: flashcard,
        },
      }
    }

    case A.ADD_CLIPS: {
      const { clips, flashcards, fileId } = action
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
        flashcards: {
          ...state.flashcards,
          ...arrayToMapById(flashcards),
        },
      }
    }

    case A.EDIT_CLIP: {
      const { id, override, flashcardOverride } = action
      const clip = state.byId[id]
      const flashcard = state.flashcards[id]
      const newClip: Clip = override
        ? {
            // START AND END SHOULD ALWAYS BE SORTED! where is the right place to do this?
            id,
            fileId: clip.fileId,
            start: override.start || clip.start,
            end: override.end || clip.end,
          }
        : clip
      const newFlashcard: Flashcard = override
        ? ({
            id,
            type: flashcard.type,
            image:
              flashcardOverride && 'image' in flashcardOverride
                ? flashcardOverride.image
                : flashcard.image,
            fields: {
              ...flashcard.fields,
              ...(flashcardOverride ? flashcardOverride.fields : null),
            },
            tags:
              flashcardOverride && flashcardOverride.tags
                ? flashcardOverride.tags.filter((t): t is string => Boolean(t))
                : flashcard.tags,
          } as Flashcard)
        : state.flashcards[id]
      return {
        ...state,
        byId:
          newClip === clip
            ? state.byId
            : {
                ...state.byId,
                [id]: newClip,
              },
        flashcards:
          newFlashcard === flashcard
            ? state.flashcards
            : { ...state.flashcards, [id]: newFlashcard },
      }
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
      const newCards: Record<ClipId, Flashcard> = {}
      newClipsOrder.forEach(id => {
        const clip = state.byId[id]
        if (!clip) throw new Error('impossible')
        newClips[id] = clip

        const card = state.flashcards[id]
        if (!card) throw new Error('impossible')
        newCards[id] = card
      })
      const sortedClipsToMerge = ids
        .sort(byStart(state.byId))
        .map(id => state.byId[id])

      const { flashcards: cards } = state
      const flashcard = newFlashcard(
        finalId,
        cards[finalId].fields,
        [
          ...sortedClipsToMerge.reduce((all, { id }) => {
            cards[id].tags.forEach((tag: string) => all.add(tag))
            return all
          }, new Set<string>()),
        ],
        cards[finalId].image
      )
      const fieldNames = getNoteTypeFields(flashcard.type)

      for (const fieldName of fieldNames) {
        const value = sortedClipsToMerge
          .map(
            ({ id }) =>
              cards[id].fields[fieldName as SimpleFlashcardFieldName] || ''
          )
          .filter(x => x.trim())
          .join('\n')
        flashcard.fields[fieldName as SimpleFlashcardFieldName] = value
      }

      newClips[finalId] = {
        ...state.byId[finalId],
        start: sortedClipsToMerge[0].start,
        end: sortedClipsToMerge[sortedClipsToMerge.length - 1].end,
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
        flashcards: {
          ...newCards,
          [finalId]: flashcard,
        },
      }
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
      const card: Flashcard = state.flashcards[id]

      const flashcards: FlashcardsState = {
        ...state.flashcards,
        [id]: {
          ...card,
          fields: {
            ...(card.fields as TransliterationFlashcardFields),
            [key as TransliterationFlashcardFieldName]: value,
          },
        },
      }
      return {
        ...state,
        flashcards,
      }
    }

    case A.ADD_FLASHCARD_TAG: {
      const { id, text } = action

      return {
        ...state,

        flashcards: {
          ...state.flashcards,
          [id]: {
            ...state.flashcards[id],

            tags: [
              ...(state.flashcards[id].tags || []),
              text.replace(/\s/g, '_'),
            ],
          },
        },
      }
    }

    case A.DELETE_FLASHCARD_TAG: {
      const { id, index } = action
      const newTags = [...state.flashcards[id].tags]
      newTags.splice(index, 1)

      return {
        ...state,

        flashcards: {
          [id]: {
            ...state.flashcards[id],

            ...state.flashcards[id],
            tags: newTags,
          },
        },
      }
    }

    case A.DELETE_FILE_SUCCESS: {
      if (action.file.type === 'MediaFile') {
        const clipIds = state.idsByMediaFileId[action.file.id] || []

        const byId = { ...state.byId }
        const flashcards = { ...state.flashcards }
        clipIds.forEach(id => {
          delete byId[id]
          delete flashcards[id]
        })

        const idsByMediaFileId = { ...state.idsByMediaFileId }
        delete idsByMediaFileId[action.file.id]

        return {
          ...state,
          byId,
          idsByMediaFileId,
          flashcards,
        }
      } else return state
    }
    default:
      return state
  }
}

export default clips
