import { Reducer } from 'redux'

export const initialState: FilesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  VttConvertedSubtitlesFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  VideoStillImage: {},
}

type FindByTag<Union, Tag> = Union extends { type: Tag } ? Union : never

/** CAREFUL: TS type inference is broken here, so don't forget return type for `transform`! */
const edit = <T extends FileMetadata['type']>(
  state: FilesState,
  type: T,
  id: string,
  /** CAREFUL: TS type inference is broken here, so don't forget return type! */
  transform: (file?: FindByTag<FileMetadata, T>) => FindByTag<FileMetadata, T>
) => {
  // type FileType = FindByTag<FileMetadata, T>
  const substate = state[type] as Dict<string, FindByTag<FileMetadata, T>>

  const newValue = transform(substate[id])
  return {
    ...state,
    [type]: {
      ...substate,
      [id]: newValue,
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
      if (action.file.type === 'MediaFile') {
        const parentProjectFile = state.ProjectFile[action.file.parentId]
        if (!parentProjectFile) {
          console.error(
            `Action ${action.type} was dispatched during illegal state.`
          )
          console.log(action, state, newState)
          // should be impossible
          return newState
        }

        if (!parentProjectFile.mediaFileIds.includes(action.file.id))
          return edit(
            newState,
            'ProjectFile',
            action.file.parentId,
            (file): ProjectFile => {
              return {
                ...parentProjectFile,
                ...file,
                mediaFileIds: [
                  ...new Set([
                    ...(file || parentProjectFile).mediaFileIds,
                    action.file.id,
                  ]),
                ],
              }
            }
          )
      }
      return newState
    }

    case A.ADD_SUBTITLES_TRACK: {
      const existingMediaFile = state.MediaFile[action.track.mediaFileId]
      if (!existingMediaFile) {
        console.error(
          `Action ${action.type} was dispatched during illegal state.`
        )
        console.log(action, state)
        // should be impossible
        return state
      }

      return edit(
        state,
        'MediaFile',
        action.track.mediaFileId,
        (file = existingMediaFile): MediaFile => ({
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
    }

    case A.DELETE_SUBTITLES_TRACK: {
      const existingMediaFile = state.MediaFile[action.mediaFileId]
      if (!existingMediaFile) {
        console.error(
          `Action ${action.type} was dispatched during illegal state.`
        )
        console.log(action, state)
        // should be impossible
        return state
      }
      return edit(
        state,
        'MediaFile',
        action.mediaFileId,
        (file = existingMediaFile): MediaFile => ({
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
        })
      )
    }

    case A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK: {
      const existingMediaFile = state.MediaFile[action.mediaFileId]
      if (!existingMediaFile) {
        console.error(
          `Action ${action.type} was dispatched during illegal state.`
        )
        console.log(action, state)
        // should be impossible
        return state
      }

      return edit(
        state,
        'MediaFile',
        action.mediaFileId,
        (file = existingMediaFile): MediaFile => {
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
        }
      )
    }
    case A.SET_PROJECT_NAME: {
      const existingProjectFile = state.ProjectFile[action.id]
      if (!existingProjectFile) {
        console.error(
          `Action ${action.type} was dispatched during illegal state.`
        )
        console.log(action, state)
        // should be impossible
        return state
      }

      return edit(
        state,
        'ProjectFile',
        action.id,
        (file = existingProjectFile): ProjectFile => ({
          ...file,
          name: action.name,
        })
      )
    }
    case A.DELETE_MEDIA_FROM_PROJECT: {
      const existingProjectFile = state.ProjectFile[action.projectId]
      if (!existingProjectFile) {
        console.error(
          `Action ${action.type} was dispatched during illegal state.`
        )
        console.log(action, state)
        // should be impossible
        return state
      }

      return edit(
        state,
        'ProjectFile',
        action.projectId,
        (file = existingProjectFile): ProjectFile => ({
          ...file,
          mediaFileIds: file.mediaFileIds.filter(
            id => id !== action.mediaFileId
          ),
        })
      )
    }

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
