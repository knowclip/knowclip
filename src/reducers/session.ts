import { Reducer } from 'redux'
import deleteKey from '../utils/deleteKey'
import { areSelectionsEqual } from '../utils/waveformSelection'

const initialState: SessionState = {
  pendingClip: null,
  pendingStretch: null,
  waveformSelection: null,
  defaultTags: [],
  defaultIncludeStill: true,
  currentMediaFileId: null,
  currentProjectId: null,
  workIsUnsaved: false,
  tagsToClipIds: {},
  loopMedia: false,
  mediaIsPlaying: false,
  progress: null,
}

const session: Reducer<SessionState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.DELETE_CARD:
      return state.waveformSelection &&
        state.waveformSelection.type === 'Clip' &&
        action.id === state.waveformSelection.id
        ? { ...state, waveformSelection: null }
        : state

    case A.DELETE_CARDS:
      return state.waveformSelection &&
        state.waveformSelection.type === 'Clip' &&
        action.ids.includes(state.waveformSelection.id)
        ? { ...state, waveformSelection: null }
        : state

    case A.DELETE_MEDIA_FROM_PROJECT:
      return action.mediaFileId === state.currentMediaFileId
        ? {
            ...state,
            currentMediaFileId: null,
            waveformSelection: null,
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

    case A.SELECT_WAVEFORM_ITEM:
      return areSelectionsEqual(state.waveformSelection, action.selection)
        ? state
        : {
            ...state,
            waveformSelection: action.selection,
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

    case A.SET_DEFAULT_CLIP_SPECS:
      return {
        ...state,
        defaultTags: action.tags || state.defaultTags,
        defaultIncludeStill:
          action.includeStill !== undefined
            ? action.includeStill
            : state.defaultIncludeStill,
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

    case A.PLAY_MEDIA:
      return { ...state, mediaIsPlaying: true }
    case A.PAUSE_MEDIA:
      return { ...state, mediaIsPlaying: false }

    case A.SET_PROGRESS:
      return {
        ...state,
        progress: action.progress,
      }

    case A.DISMISS_MEDIA:
      return { ...state, currentMediaFileId: null, waveformSelection: null }

    default:
      return state
  }
}

export default session
