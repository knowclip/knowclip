import { Reducer } from 'redux'
import deleteKey from '../utils/deleteKey'

export const initialState: FilesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  VttConvertedSubtitlesFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  // VideoStillImage: {},
  // },
}

const edit = <F extends FileMetadata>(
  state: FilesState,
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

const files: Reducer<FilesState, Action> = (state = initialState, action) => {
  switch (action.type) {
    case A.OPEN_FILE_SUCCESS:
      // same logic as just below
      return {
        ...state,
        [action.validatedFile.type]: {
          ...state[action.validatedFile.type],
          [action.validatedFile.id]: action.validatedFile,
        },
      }
    case A.ADD_FILE:
    case A.ADD_AND_OPEN_FILE:
    case A.LOCATE_FILE_SUCCESS: {
      const newState = {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: action.file,
        },
      }

      return action.file.type === 'MediaFile'
        ? edit<ProjectFile>(
            newState,
            'ProjectFile',
            action.file.parentId,
            file => ({
              ...file,
              mediaFileIds: [
                ...new Set([...file.mediaFileIds, action.file.id]),
              ],
            })
          )
        : newState
    }

    case A.OPEN_PROJECT:
      return edit<ProjectFile>(
        state,
        'ProjectFile',
        action.project.id,
        file => ({
          ...file,
          lastOpened: action.now,
        })
      )

    case A.ADD_SUBTITLES_TRACK:
      return edit<MediaFile>(
        state,
        'MediaFile',
        action.track.mediaFileId,
        file => ({
          ...file,
          subtitles: [...new Set([...file.subtitles, action.track.id])],
        })
      )

    case A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK:
      return edit<MediaFile>(state, 'MediaFile', action.mediaFileId, file => ({
        ...file,
        flashcardFieldsToSubtitlesTracks: {
          ...file.flashcardFieldsToSubtitlesTracks,
          [action.flashcardFieldName]: action.subtitlesTrackId,
        },
      }))

    case A.SET_PROJECT_NAME:
      return edit<ProjectFile>(state, 'ProjectFile', action.id, file => ({
        ...file,
        name: action.name,
      }))

    case A.DELETE_MEDIA_FROM_PROJECT:
      return edit<ProjectFile>(
        state,
        'ProjectFile',
        action.projectId,
        file => ({
          ...file,
          mediaFileIds: file.mediaFileIds.filter(
            id => id !== action.mediaFileId
          ),
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

export default files
