import { Reducer } from 'redux'

const initialState: SubtitlesState = {}

const subtitles: Reducer<SubtitlesState> = (
  state: SubtitlesState = initialState,
  action: Action
) => {
  switch (action.type) {
    case A.ADD_SUBTITLES_TRACK:
      return { ...state, [action.track.id]: action.track }
    case A.LOAD_FILE_REQUEST:
      return action.fileRecord.type === 'MediaFile' ? initialState : state
    default:
      return state
  }
}

export default subtitles
