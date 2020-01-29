import { Reducer } from 'redux'
import { LOCATE_FILE_REQUEST } from '../types/ActionType'

export const initialState: FilesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  VttConvertedSubtitlesFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  VideoStillImage: {},
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
    case A.LOAD_PERSISTED_STATE:
      return action.files || state

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
    case A.OPEN_FILE_REQUEST:
    case A.LOCATE_FILE_SUCCESS: {
      const newState = {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: action.file,
        },
      }

      return action.file.type === 'MediaFile' &&
        !state.ProjectFile[action.file.parentId].mediaFileIds.includes(
          action.file.id
        )
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
          subtitles: file.subtitles.some(s => s.id === action.track.id)
            ? file.subtitles
            : [
                ...file.subtitles,
                action.track.type === 'EmbeddedSubtitlesTrack'
                  ? {
                      type: 'EmbeddedSubtitlesTrack',
                      id: action.track.id,
                      streamIndex: action.track.streamIndex,
                    }
                  : { type: 'ExternalSubtitlesTrack', id: action.track.id },
              ],
        })
      )

    case A.DELETE_SUBTITLES_TRACK:
      return edit<MediaFile>(state, 'MediaFile', action.mediaFileId, file => ({
        ...file,
        subtitles: file.subtitles.filter(({ id }) => id !== action.id),
        flashcardFieldsToSubtitlesTracks: Object.entries(
          file.flashcardFieldsToSubtitlesTracks
        )
          .filter(([fieldName, trackId]) => trackId !== action.id)
          .reduce(
            (all, [fieldName, trackId]) => {
              all[fieldName as TransliterationFlashcardFieldName] = trackId
              return all
            },
            {} as Partial<Record<TransliterationFlashcardFieldName, string>>
          ),
      }))

    case A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK:
      return edit<MediaFile>(state, 'MediaFile', action.mediaFileId, file => {
        const flashcardFieldsToSubtitlesTracks = {
          ...file.flashcardFieldsToSubtitlesTracks,
        }
        if (action.subtitlesTrackId) {
          for (const [fieldName, trackId] of Object.entries(
            flashcardFieldsToSubtitlesTracks
          )) {
            if (trackId === action.subtitlesTrackId)
              delete flashcardFieldsToSubtitlesTracks[
                fieldName as TransliterationFlashcardFieldName
              ]
          }

          flashcardFieldsToSubtitlesTracks[action.flashcardFieldName] =
            action.subtitlesTrackId
        } else {
          delete flashcardFieldsToSubtitlesTracks[action.flashcardFieldName]
        }

        return {
          ...file,
          flashcardFieldsToSubtitlesTracks,
        }
      })

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

    case A.DELETE_FILE_SUCCESS: {
      const { [action.file.id]: _, ...newSubstate } = state[action.file.type]
      const newState = { ...state, [action.file.type]: newSubstate }
      for (const descendant of action.descendants) {
        if (
          newState[descendant.type] &&
          newState[descendant.type][descendant.id]
        )
          delete newState[descendant.type][descendant.id]
      }
      return newState
    }

    default:
      return state
  }
}

export default files
