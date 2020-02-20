import { Reducer } from 'redux'

const initialState: LinkedSubtitlesState = {
  cuesBase: null,
  chunks: [],
}

const linkedSubtitles: Reducer<LinkedSubtitlesState> = (
  state: LinkedSubtitlesState = initialState,
  action: Action
) => {
  switch (action.type) {
    case A.OPEN_FILE_REQUEST:
      return action.file.type === 'MediaFile' ? initialState : state

    // case A.DELETE_SUBTITLES_TRACK: {
    //   const { [action.id]: _, ...newState } = state
    //   return newState
    // }

    default:
      return state
  }
}

export default linkedSubtitles
