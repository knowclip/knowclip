import { Reducer } from 'redux'

export const initialState: MediaState = {
  byId: {},
}

const editTrack: <T extends SubtitlesTrack>(
  track: T,
  overrides: Partial<T>
) => T = (track, overrides) => ({
  ...track,
  ...overrides,
})

const media: Reducer<MediaState, Action> = (state = initialState, action) => {
  switch (action.type) {
    case A.OPEN_PROJECT:
      return {
        ...state,
        byId: {
          ...state.byId,
          ...Object.values(action.project.mediaFilesMetadata).reduce(
            (all, metadata) => {
              const existing: MediaFile | { [any: string]: any } =
                state.byId[metadata.id] || {}

              all[metadata.id] = {
                filePath: existing.filePath || null,
                constantBitrateFilePath:
                  existing.constantBitrateFilePath || null,
                subtitles: existing.subtitles || [],
                flashcardFieldsToSubtitlesTracks:
                  existing.flashcardFieldsToSubtitlesTracks || {},
                error: existing.error || null,
                metadata: existing.metadata || null,
              }
              return all
            },
            {} as Record<MediaFileId, MediaFile>
          ),
        },
      }
    // case A.CLOSE_PROJECT:
    //   return {
    //     ...initialState,
    //     byId: initialState.byId,
    //   }
    case A.ADD_MEDIA_TO_PROJECT:
      return {
        ...state,
        byId: {
          ...state.byId,
          ...action.mediaFiles.reduce(
            (map, file) => {
              map[file.metadata.id] = file
              return map
            },
            {} as Record<MediaFileId, MediaFile>
          ),
        },
      }

    case A.DELETE_MEDIA_FROM_PROJECT: {
      const newById = { ...state.byId }
      delete newById[action.mediaFileId]
      return {
        ...state,
        byId: newById,
      }
    }
    case A.LOCATE_MEDIA_FILE_SUCCESS:
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.metadata.id]: {
            ...state.byId[action.metadata.id],
            filePath: action.filePath,
            metadata: action.metadata,
          },
        },
      }

    case A.OPEN_MEDIA_FILE_SUCCESS:
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.metadata.id]: {
            ...state.byId[action.metadata.id],
            filePath: action.filePath,
            metadata: action.metadata,
            constantBitrateFilePath: action.constantBitrateFilePath,
          },
        },
      }

    case A.LOAD_EMBEDDED_SUBTITLES_SUCCESS:
    case A.LOAD_EXTERNAL_SUBTITLES_SUCCESS:
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.mediaFileId]: {
            ...state.byId[action.mediaFileId],
            subtitles: [
              ...state.byId[action.mediaFileId].subtitles,
              ...action.subtitlesTracks,
            ],
          },
        },
      }
    case A.SHOW_SUBTITLES: {
      const { id, mediaFileId } = action
      return {
        ...state,
        byId: {
          ...state.byId,
          [mediaFileId]: {
            ...state.byId[mediaFileId],
            subtitles: state.byId[mediaFileId].subtitles.map(track =>
              track.id === id ? editTrack(track, { mode: 'showing' }) : track
            ),
          },
        },
      }
    }

    case A.HIDE_SUBTITLES: {
      const { id, mediaFileId } = action
      return {
        ...state,
        byId: {
          ...state.byId,
          [mediaFileId]: {
            ...state.byId[mediaFileId],
            subtitles: state.byId[mediaFileId].subtitles.map(track =>
              track.id === id ? editTrack(track, { mode: 'hidden' }) : track
            ),
          },
        },
      }
    }

    case A.DELETE_SUBTITLES_TRACK:
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.mediaFileId]: {
            ...state.byId[action.mediaFileId],
            subtitles: state.byId[action.mediaFileId].subtitles.filter(
              ({ id }) => id !== action.id
            ),
          },
        },
      }

    case A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK:
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.mediaFileId]: {
            ...state.byId[action.mediaFileId],
            flashcardFieldsToSubtitlesTracks: {
              ...state.byId[action.mediaFileId]
                .flashcardFieldsToSubtitlesTracks,
              [action.flashcardFieldName]: action.subtitlesTrackId,
            },
          },
        },
      }

    default:
      return state
  }
}

export default media
