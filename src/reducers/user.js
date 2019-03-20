// @flow

const initialState: UserState = {
  pendingClip: null,
  pendingStretch: null,
  highlightedClipId: null,
  // defaultNoteTypeId: 'default',
  defaultTags: [],
  currentMediaFileId: null,
  currentProjectId: null,
}

const user: Reducer<UserState> = (state = initialState, action) => {
  switch (action.type) {
    case 'OPEN_PROJECT':
      return {
        ...state,
        currentProjectId: action.project.id,
      }

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

    default:
      return state
  }
}

export default user
