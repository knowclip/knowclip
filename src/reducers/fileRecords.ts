import { Reducer } from 'redux'
import deleteKey from '../utils/deleteKey'

export const initialState: FileRecordsState = {
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
    case A.ADD_AND_LOAD_FILE:
    case A.LOCATE_FILE_SUCCESS: {
      const newState = {
        ...state,
        [action.fileRecord.type]: {
          ...state[action.fileRecord.type],
          [action.fileRecord.id]: action.fileRecord,
        },
      }

      return action.fileRecord.type === 'MediaFile'
        ? edit<ProjectFileRecord>(
            newState,
            'ProjectFile',
            action.fileRecord.parentId,
            file => ({
              ...file,
              mediaFiles: [
                ...new Set([...file.mediaFiles, action.fileRecord.id]),
              ],
            })
          )
        : newState
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

    case A.SET_PROJECT_NAME:
      return edit<ProjectFileRecord>(state, 'ProjectFile', action.id, file => ({
        ...file,
        name: action.name,
      }))

    case A.DELETE_MEDIA_FROM_PROJECT:
      return edit<ProjectFileRecord>(
        state,
        'ProjectFile',
        action.projectId,
        file => ({
          ...file,
          mediaFiles: file.mediaFiles.filter(id => id !== action.mediaFileId),
        })
      )

    case A.REMOVE_PROJECT_FROM_RECENTS:
      return {
        ...state,
        ProjectFile: deleteKey(state.ProjectFile, action.id),
      }

    default:
      return state
  }
}

export default fileRecords
