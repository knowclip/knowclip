import { Reducer } from 'redux'

const initialState: SubtitlesState = {}

const subtitles: Reducer<SubtitlesState> = (
  state: SubtitlesState = initialState,
  action: Action
) => {
  switch (action.type) {
    case A.ADD_SUBTITLES_TRACK:
      return { ...state, [action.track.id]: action.track }
    case A.OPEN_MEDIA_FILE_REQUEST:
      return initialState
    default:
      return state
  }
}

export default subtitles
