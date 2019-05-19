// @flow
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
}

const user: Reducer<UserState> = (state = initialState, action) => {
  switch (action.type) {
    case 'DELETE_CARD':
      return action.id === state.highlightedClipId
        ? { ...state, highlightedClipId: null }
        : state

    case 'DELETE_MEDIA_FROM_PROJECT':
      return action.mediaFileId === state.currentMediaFileId
        ? {
            ...state,
            currentMediaFileId: null,
          }
        : state

    case 'OPEN_PROJECT':
      return {
        ...state,
        currentProjectId: action.project.id,
      }

    case 'CLOSE_PROJECT':
      return initialState

    case 'OPEN_MEDIA_FILE_REQUEST':
      return {
        ...state,
        currentMediaFileId: action.id,
      }

    case 'ADD_CLIP':
      return {
        ...state,
        pendingClip: null,
      }

    case 'SET_PENDING_CLIP':
      return {
        ...state,
        pendingClip: action.clip,
      }

    case 'HIGHLIGHT_CLIP':
      return {
        ...state,
        highlightedClipId: action.id,
      }

    case 'SET_PENDING_STRETCH':
      return {
        ...state,
        pendingStretch: action.stretch,
      }

    case 'SET_DEFAULT_TAGS':
      return {
        ...state,
        defaultTags: action.tags,
      }

    case 'SET_ALL_TAGS':
      return {
        ...state,
        tagsToClipIds: action.tagsToClipIds,
      }

    case 'ADD_FLASHCARD_TAG': {
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

    case 'DELETE_FLASHCARD_TAG': {
      const { tag } = action
      const newIds = (state.tagsToClipIds[tag] || []).filter(
        id => id !== action.id
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

    case 'SET_WORK_IS_UNSAVED':
      return {
        ...state,
        workIsUnsaved: action.workIsUnsaved,
      }

    default:
      return state
  }
}

export default user
