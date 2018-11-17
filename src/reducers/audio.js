// @flow
const initialState: AudioState = {
  loop: true,
  currentFileIndex: 0,
  files: {},
  filesOrder: [],
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
        currentFileIndex: 0,
      }
    }

    case 'SET_CURRENT_FILE':
      return {
        ...state,
        currentFileIndex: action.index,
      }

    default:
      return state
  }
}

export default audio
