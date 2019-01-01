// @flow
const initialState: AudioState = {
  loop: true,
  currentFileIndex: 0,
  files: {},
  filesOrder: [],
  isLoading: false,
}

const audio: Reducer<AudioState> = (
  state: AudioState = initialState,
  action: Object
) => {
  switch (action.type) {
    case 'TOGGLE_LOOP':
      return {
        ...state,
        loop: !state.loop,
      }

    case 'CHOOSE_AUDIO_FILES': {
      const { filePaths } = action

      return {
        ...state,
        filesOrder: filePaths,
        files: filePaths.reduce(
          (files, path) => ({ ...files, [path]: { path } }),
          {}
        ),
        isLoading: true,
        currentFileIndex: 0,
      }
    }

    case 'SET_CURRENT_FILE':
      return {
        ...state,
        currentFileIndex: action.index,
      }

    case 'LOAD_AUDIO':
      return {
        ...state,
        isLoading: Boolean(action.file),
      }

    case 'LOAD_AUDIO_SUCCESS':
      return {
        ...state,
        isLoading: false,
      }

    default:
      return state
  }
}

export default audio
