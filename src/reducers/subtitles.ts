import { Reducer } from 'redux'

const initialState: SubtitlesState = {
  mediaFileTracksStreamIndexes: [],
  flashcardFieldLinks: {},
}

const subtitles: Reducer<SubtitlesState> = (
  state: SubtitlesState = initialState,
  action: Action
) => {
  switch (action.type) {
    case A.OPEN_MEDIA_FILE_SUCCESS:
      return {
        ...state,
        mediaFileTracksStreamIndexes: action.subtitlesTracksStreamIndexes,
      }
    case A.OPEN_MEDIA_FILE_REQUEST:
    case A.OPEN_PROJECT:
    case A.CLOSE_PROJECT:
      return initialState
    case A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK:
      return {
        ...state,
        flashcardFieldLinks: {
          ...state.flashcardFieldLinks,
          [action.flashcardFieldName]: action.subtitlesTrackId,
        },
      }
    default:
      return state
  }
}

export default subtitles
