import { Reducer } from 'redux'
import deleteKey from '../utils/deleteKey'

const initialState: UserState = {
  pendingClip: null,
  pendingStretch: null,
  highlightedClipId: null,
  defaultTags: [],
  currentMediaFileId: null,
  currentProjectId: null,
  workIsUnsaved: false,
  tagsToClipIds: {},
  mediaIsLoading: false,
  loopMedia: true,
}

const user: Reducer<UserState, Action> = (state = initialState, action) => {
  switch (action.type) {
    case A.DELETE_CARD:
      return action.id === state.highlightedClipId
        ? { ...state, highlightedClipId: null }
        : state

    case A.DELETE_CARDS:
      return state.highlightedClipId &&
        action.ids.includes(state.highlightedClipId)
        ? { ...state, highlightedClipId: null }
        : state

    case A.DELETE_MEDIA_FROM_PROJECT:
      return action.mediaFileId === state.currentMediaFileId
        ? {
            ...state,
            currentMediaFileId: null,
            highlightedClipId: null,
          }
        : state

    case A.OPEN_PROJECT:
      return {
        ...state,
        currentProjectId: action.project.id,
      }

    case A.CLOSE_PROJECT:
      return initialState

    case A.OPEN_FILE_REQUEST:
      if (action.file.type === 'MediaFile')
        return {
          ...state,
          currentMediaFileId: action.file.id,
          mediaIsLoading: true,
        }

      return state

    case A.ADD_CLIP:
      return {
        ...state,
        pendingClip: null,
      }

    case A.SET_PENDING_CLIP:
      return {
        ...state,
        pendingClip: action.clip,
      }

    case A.CLEAR_PENDING_CLIP:
      return {
        ...state,
        pendingClip: null,
      }

    case A.HIGHLIGHT_CLIP:
      return {
        ...state,
        highlightedClipId: action.id,
      }

    case A.SET_PENDING_STRETCH:
      return {
        ...state,
        pendingStretch: action.stretch,
      }

    case A.CLEAR_PENDING_STRETCH:
      return {
        ...state,
        pendingStretch: null,
      }

    case A.SET_DEFAULT_TAGS:
      return {
        ...state,
        defaultTags: action.tags,
      }

    case A.SET_ALL_TAGS:
      return {
        ...state,
        tagsToClipIds: action.tagsToClipIds,
      }

    case A.ADD_FLASHCARD_TAG: {
      const { text, id } = action
      const ids = state.tagsToClipIds[text] || []

      if (ids.includes(id)) return state

      return {
        ...state,
        tagsToClipIds: {
          ...state.tagsToClipIds,
          [text]: [...ids, id],
        },
      }
    }

    case A.DELETE_FLASHCARD_TAG: {
      const { tag } = action
      const newIds = (state.tagsToClipIds[tag] || []).filter(
        (id: String) => id !== action.id
      )
      const newTagsToClipIds = newIds.length
        ? {
            ...state.tagsToClipIds,
            [tag]: newIds,
          }
        : deleteKey({ ...state.tagsToClipIds }, tag)

      return {
        ...state,
        tagsToClipIds: newTagsToClipIds,
      }
    }
    // const prevTags: any = Object.keys(prevTagsToClipIds)
    // const deletedTags: Array<string> = prevTags.filter(
    //   tag => !value.includes(tag)
    // )
    // const tagsToClipIds = { ...prevTagsToClipIds }
    // value.forEach(tag => {
    //   tagsToClipIds[tag] = (tagsToClipIds[tag] || []).concat(id)
    // })
    // deletedTags.forEach(tag => {
    //   tagsToClipIds[tag] = (tagsToClipIds[tag] || []).filter(
    //     clipId => clipId !== id
    //   )
    //   if (!tagsToClipIds[tag].length) delete tagsToClipIds[tag]
    // })

    // return {
    //   ...state,
    //   tagsToClipIds,
    // }

    case A.SET_WORK_IS_UNSAVED:
      return {
        ...state,
        workIsUnsaved: action.workIsUnsaved,
      }

    case A.TOGGLE_LOOP:
      return {
        ...state,
        loopMedia: !state.loopMedia,
      }

    case A.SET_LOOP:
      return {
        ...state,
        loopMedia: action.loop,
      }

    case A.OPEN_FILE_SUCCESS: // temp
      return action.validatedFile.type === 'MediaFile'
        ? {
            ...state,
            mediaIsLoading: false, // should probably exist in fileAvailabilities state
          }
        : state // what about cbr

    case A.OPEN_FILE_FAILURE:
      return action.file.type === 'MediaFile'
        ? {
            ...state,
            mediaIsLoading: false,
          }
        : state // what about cbr

    default:
      return state
  }
}

export default user
