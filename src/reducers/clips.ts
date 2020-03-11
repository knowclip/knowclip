import { Reducer, DeepPartial } from 'redux'
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
        const ids = idsByMediaFileId[clip.fileId]

        ids.push(clip.id) // TODO: secure case when ids is undefined
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
      return editClip(state, id, override, flashcardOverride)
    }

    case A.EDIT_CLIPS: {
      let newState = state
      for (const { id, override, flashcardOverride } of action.edits) {
        const updated = editClip(newState, id, override, flashcardOverride)
        newState = updated
      }
      return newState
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
        if (fieldName === 'transcription') {
          const mergingCards = sortedClipsToMerge.map(({ id }) => cards[id])
          const { clozeDeletions, text } = mergeClozeFields(
            mergingCards,
            fieldName
          )
          flashcard.fields[fieldName as SimpleFlashcardFieldName] = text
          flashcard.cloze = clozeDeletions
        } else {
          const values = sortedClipsToMerge.map(
            ({ id }) =>
              cards[id].fields[fieldName as SimpleFlashcardFieldName] || ''
          )

          const value = values.filter(x => x.trim()).join('\n')
          flashcard.fields[fieldName as SimpleFlashcardFieldName] = value
        }
      }

      if (flashcard.cloze.length > 10) console.error(flashcard.cloze.splice(10))

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
      const { id, key, value, caretLocation } = action
      const card: Flashcard = state.flashcards[id]
      const editDifference = value.length - card.fields.transcription.length
      const caretStart = caretLocation - editDifference

      const editStart = Math.min(caretStart, caretLocation)
      const editEnd = Math.max(caretStart, caretLocation)

      const cloze =
        key === 'transcription' && card.cloze.length
          ? adjustClozeRanges(card, editDifference, editStart, editEnd)
          : card.cloze

      const flashcards: FlashcardsState = {
        ...state.flashcards,
        [id]: {
          ...card,
          fields: {
            ...(card.fields as TransliterationFlashcardFields),
            [key as TransliterationFlashcardFieldName]: value,
          },
          cloze,
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

export function mergeClozeFields(
  mergingCards: { fields: Flashcard['fields']; cloze: Flashcard['cloze'] }[],
  fieldName: string
) {
  const clozeDeletions: ClozeDeletion[] = []
  let mergedValueSoFar = ''

  let mergingCardIndex = 0
  for (const card of mergingCards) {
    const transcriptionText =
      card.fields[fieldName as SimpleFlashcardFieldName] || ''
    const trimmed = transcriptionText.trim()
    if (mergingCardIndex > 0 && trimmed) mergedValueSoFar += '\n'
    const mergingCard = mergingCards[mergingCardIndex]

    clozeDeletions.push(
      /* eslint-disable no-loop-func */
      ...mergingCard.cloze.map(c => ({
        /* eslint-enable no-loop-func */
        ...c,
        ranges: c.ranges.map(r => ({
          start: r.start + mergedValueSoFar.length,
          end: r.end + mergedValueSoFar.length,
        })),
      }))
    )
    mergedValueSoFar += trimmed
    mergingCardIndex++
  }
  return { clozeDeletions, text: mergedValueSoFar }
}

function adjustClozeRanges(
  card: Flashcard,
  editDifference: number,
  editStart: number,
  editEnd: number
) {
  return card.cloze
    .map(c => ({
      ...c,
      ranges: c.ranges
        .map(r => {
          if (editDifference < 0) {
            const deletion = {
              start: editStart,
              end: editEnd,
            }
            const overlap = deletion.start <= r.end && deletion.end > r.start
            if (overlap && (deletion.start < r.start || deletion.end > r.end)) {
              return deletion.start < r.start
                ? {
                    start: deletion.start,
                    end: deletion.start + 1 + (r.end - deletion.end),
                  }
                : {
                    start: r.start,
                    end: deletion.start,
                  }
            }
          }
          return {
            start: editStart >= r.start ? r.start : r.start + editDifference,
            end: editStart <= r.end ? r.end + editDifference : r.end,
          }
        })
        .filter(
          r => r.start !== r.end && r.end > r.start && r.end > 0 && r.start >= 0
        ),
    }))
    .filter(c => c.ranges.length)
}

function editClip(
  state: ClipsState,
  id: string,
  override: DeepPartial<Clip> | null,
  flashcardOverride: DeepPartial<Flashcard> | null
) {
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

  const fields = {
    ...flashcard.fields,
    ...(flashcardOverride ? flashcardOverride.fields : null),
  } as TransliterationFlashcardFields
  const newFlashcard: Flashcard = flashcardOverride
    ? {
        id,
        type: flashcard.type,
        image:
          'image' in flashcardOverride
            ? flashcardOverride.image
            : flashcard.image,
        fields,
        tags: flashcardOverride.tags
          ? flashcardOverride.tags.filter((t): t is string => Boolean(t))
          : flashcard.tags,
        cloze: (flashcardOverride.cloze as ClozeDeletion[]) || flashcard.cloze,
      }
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

export default clips
