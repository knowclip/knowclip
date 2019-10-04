import { Reducer } from "redux"

export const initialState = {
  loop: true,
  isLoading: false,
  mediaFolderLocation: null,
}

const audio: Reducer<MediaState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case 'TOGGLE_LOOP':
      return {
        ...state,
        loop: !state.loop,
      }

    case 'SET_LOOP':
      return {
        ...state,
        loop: action.loop,
      }

    case 'CLOSE_PROJECT': // maybe better as action for closed media specifically
      return {
        ...state,
        loop: true,
        isLoading: false,
      }

    case 'OPEN_MEDIA_FILE_REQUEST':
      return {
        ...state,
        isLoading: true,
      }

    case 'OPEN_MEDIA_FILE_FAILURE':
    case 'OPEN_MEDIA_FILE_SUCCESS':
      return {
        ...state,
        isLoading: false,
      }

    case 'SET_MEDIA_FOLDER_LOCATION':
      return {
        ...state,
        mediaFolderLocation: action.directoryPath,
      }

    default:
      return state
  }
}

export default audio
