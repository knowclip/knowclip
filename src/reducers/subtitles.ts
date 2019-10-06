import { Reducer } from 'redux'

const initialState: SubtitlesState = {
  loadedTracks: [],
  mediaFileTracksStreamIndexes: [],
  flashcardFieldLinks: {
    transcription: '',
    pronunciation: '',
    meaning: '',
    notes: '',
  },
}

const editTrack: <T extends SubtitlesTrack>(
  track: T,
  overrides: Partial<T>
) => T = (track, overrides) => ({
  ...track,
  ...overrides,
})

const subtitles: Reducer<SubtitlesState> = (
  state: SubtitlesState = initialState,
  action: Action
) => {
  switch (action.type) {
    case A.OPEN_MEDIA_FILE_SUCCESS:
      return {
        ...state,
        mediaFileTracksStreamIndexes: action.subtitlesTracksStreamIndexes,
        loadedTracks: [],
      }
    case A.OPEN_MEDIA_FILE_REQUEST:
    case A.OPEN_PROJECT:
    case A.CLOSE_PROJECT:
      return initialState
    case A.LOAD_EMBEDDED_SUBTITLES_SUCCESS:
    case A.LOAD_EXTERNAL_SUBTITLES_SUCCESS:
      return {
        ...state,
        loadedTracks: [...state.loadedTracks, ...action.subtitlesTracks],
      }
    case A.SHOW_SUBTITLES: {
      const { id } = action
      return {
        ...state,
        loadedTracks: state.loadedTracks.map(track =>
          track.id === id ? editTrack(track, { mode: 'showing' }) : track
        ),
      }
    }
    case A.HIDE_SUBTITLES: {
      const { id } = action
      return {
        ...state,
        loadedTracks: state.loadedTracks.map(track =>
          track.id === id ? editTrack(track, { mode: 'hidden' }) : track
        ),
      }
    }
    case A.DELETE_SUBTITLES_TRACK: {
      const { id } = action
      return {
        ...state,
        loadedTracks: state.loadedTracks.filter(track => track.id !== id),
      }
    }
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
