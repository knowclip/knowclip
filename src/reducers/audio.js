const initialState = {
  loop: true,
  currentFileIndex: 0,
  filePaths: [],
}

export default function audio(state = initialState, action) {
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
        filePaths,
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
