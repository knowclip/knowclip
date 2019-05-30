// @flow

const initialState: SubtitlesState = {
  loadedTracks: [],
  mediaFileTracksStreamIndexes: [],
  flashcardFieldLinks: {},
}

const editEmbeddedTrack = (
  track: EmbeddedSubtitlesTrack,
  overrides: Exact<EmbeddedSubtitlesTrack>
): EmbeddedSubtitlesTrack => ({
  ...track,
  ...overrides,
})
const editExternalTrack = (
  track: ExternalSubtitlesTrack,
  overrides: Exact<ExternalSubtitlesTrack>
): ExternalSubtitlesTrack => ({
  ...track,
  ...overrides,
})
const editTrack = (track: SubtitlesTrack, overrides: Object): SubtitlesTrack =>
  track.type === 'EmbeddedSubtitlesTrack'
    ? editEmbeddedTrack(track, overrides)
    : editExternalTrack(track, overrides)

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
    case 'LOAD_SUBTITLES_SUCCESS':
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
