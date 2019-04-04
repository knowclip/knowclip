// @flow
const initialState: AudioState = {
  loop: true,
  isLoading: false,
  mediaFolderLocation: null,
  constantBitrateFilePath: null,
}

const audio: Reducer<AudioState> = (
  state: AudioState = initialState,
  action: Action
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
        constantBitrateFilePath: null,
      }

    case 'OPEN_MEDIA_FILE_REQUEST':
      return {
        ...state,
        constantBitrateFilePath: null,
        isLoading: true,
      }

    case 'OPEN_MEDIA_FILE_SUCCESS':
      return {
        ...state,
        constantBitrateFilePath: action.constantBitrateFilePath,
        isLoading: false,
      }

    case 'OPEN_MEDIA_FILE_FAILURE':
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
