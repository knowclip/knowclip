import { Reducer } from 'redux'

export const initialState: FileRecordsState = {
  // byId: {},
  // idsByBaseFileId: {},
  // byType: {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  TemporaryVttFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  // VideoStillImage: {},
  // },
}

const edit = <F extends FileRecord>(
  state: FileRecordsState,
  type: F['type'],
  id: string,
  transform: (file: F) => F
) => {
  const substate: Record<string, F> = (state[type] as unknown) as Record<
    string,
    F
  >
  return {
    ...state,
    [type]: {
      ...substate,
      [id]: transform(state[type][id] as F),
    },
  }
}

const fileRecords: Reducer<FileRecordsState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.ADD_FILE:
    case A.LOCATE_FILE_SUCCESS:
      return {
        ...state,
        [action.fileRecord.type]: {
          ...state[action.fileRecord.type],
          [action.fileRecord.id]: action.fileRecord,
        },
      }
    case A.ADD_SUBTITLES_TRACK:
      return edit<MediaFileRecord>(
        state,
        'MediaFile',
        action.track.mediaFileId,
        file => ({
          ...file,
          subtitles: [...new Set([...file.subtitles, action.track.id])],
        })
      )

    case A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK:
      return edit<MediaFileRecord>(
        state,
        'MediaFile',
        action.mediaFileId,
        file => ({
          ...file,
          flashcardFieldsToSubtitlesTracks: {
            ...file.flashcardFieldsToSubtitlesTracks,
            [action.flashcardFieldName]: action.subtitlesTrackId,
          },
        })
      )

    case A.OPEN_PROJECT:
      return {
        ...state,
        MediaFile: {
          ...state.MediaFile,
          ...action.mediaFiles.reduce(
            (all, media) => {
              all[media.id] = media
              return all
            },
            {} as Record<string, MediaFileRecord>
          ),
        },
      }

    case A.SET_PROJECT_NAME:
      return edit<ProjectFileRecord>(state, 'ProjectFile', action.id, file => ({
        ...file,
        name: action.name,
      }))

    default:
      return state
  }
}

export default fileRecords
