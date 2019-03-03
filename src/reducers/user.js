// @flow

const initialState: UserState = {
  pendingClip: null,
  pendingStretch: null,
  highlightedClipId: null,
  defaultNoteTypeId: 'default',
  defaultTags: [],
}

const user: Reducer<UserState> = (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_CLIP':
      return {
        ...state,
        pendingClip: null,
      }

    case 'SET_WAVEFORM_PENDING_SELECTION':
      return {
        ...state,
        pendingClip: action.clip,
      }

    case 'HIGHLIGHT_CLIP':
      return {
        ...state,
        highlightedClipId: action.id,
      }

    case 'SET_WAVEFORM_PENDING_STRETCH':
      return {
        ...state,
        pendingStretch: action.stretch,
      }

    case 'SET_DEFAULT_TAGS':
      return {
        ...state,
        defaultTags: action.tags,
      }

    default:
      return state
  }
}

export default user
