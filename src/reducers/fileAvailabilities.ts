import { Reducer } from 'redux'

export const initialState: FileAvailabilitiesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  VttConvertedSubtitlesFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  VideoStillImage: {},
}

const fileAvailabilities: Reducer<FileAvailabilitiesState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.LOAD_PERSISTED_STATE:
      return action.fileAvailabilities || state

    case A.OPEN_FILE_REQUEST: {
      const base: FileAvailability = state[action.file.type][
        action.file.id
      ] || {
        id: action.file.id,
        status: 'NOT_LOADED',
        filePath: null,
      }
      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: {
            ...base,
            isLoading: true,
          },
        },
      }
    }

    case A.OPEN_FILE_SUCCESS: {
      const fileAvailability: FileAvailability = {
        ...state[action.validatedFile.type][action.validatedFile.id],
        status: 'CURRENTLY_LOADED',
        isLoading: false,
        filePath: action.filePath,
      }
      return {
        ...state,
        [action.validatedFile.type]: {
          ...state[action.validatedFile.type],
          [action.validatedFile.id]: fileAvailability,
        },
      }
    }

    case A.OPEN_FILE_FAILURE:
      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: {
            ...state[action.file.type][action.file.id],
            status:
              state[action.file.type][action.file.id].status ===
              'CURRENTLY_LOADED'
                ? 'REMEMBERED'
                : state[action.file.type][action.file.id].status,
            isLoading: false,
          },
        },
      }

    case A.ADD_AND_OPEN_FILE:
    case A.ADD_FILE:
    case A.LOCATE_FILE_SUCCESS: {
      if (!action.filePath) return state

      const currentFile = state[action.file.type][action.file.id] || null
      const fileAvailability: FileAvailability = currentFile
        ? {
            id: action.file.id,
            status: 'REMEMBERED',
            filePath: action.filePath,
            isLoading: false,
          }
        : {
            filePath: action.filePath,
            status: 'REMEMBERED',
            id: action.file.id,
            isLoading: false,
          }
      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: fileAvailability,
        },
      }
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

export default fileAvailabilities
