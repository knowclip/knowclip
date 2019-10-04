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
    case 'OPEN_MEDIA_FILE_SUCCESS':
      return {
        ...state,
        mediaFileTracksStreamIndexes: action.subtitlesTracksStreamIndexes,
        loadedTracks: [],
      }
    case 'OPEN_MEDIA_FILE_REQUEST':
    case 'OPEN_PROJECT':
    case 'CLOSE_PROJECT':
      return initialState
    case 'LOAD_EMBEDDED_SUBTITLES_SUCCESS':
    case 'LOAD_EXTERNAL_SUBTITLES_SUCCESS':
      return {
        ...state,
        loadedTracks: [...state.loadedTracks, ...action.subtitlesTracks],
      }
    case 'SHOW_SUBTITLES': {
      const { id } = action
      return {
        ...state,
        loadedTracks: state.loadedTracks.map(track =>
          track.id === id ? editTrack(track, { mode: 'showing' }) : track
        ),
      }
    }
    case 'HIDE_SUBTITLES': {
      const { id } = action
      return {
        ...state,
        loadedTracks: state.loadedTracks.map(track =>
          track.id === id ? editTrack(track, { mode: 'hidden' }) : track
        ),
      }
    }
    case 'DELETE_SUBTITLES_TRACK': {
      const { id } = action
      return {
        ...state,
        loadedTracks: state.loadedTracks.filter(track => track.id !== id),
      }
    }
    case 'LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK':
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
