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
      const type = action.file.type
      const byType = state[type]
      const base = byType[action.file.id]
      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: base
            ? {
                ...base,
                isLoading: true,
              }
            : {
                id: action.file.id,
                status: 'NEVER_LOADED',
                filePath: action.filePath,
                isLoading: true,
              },
        },
      }
    }

    case A.OPEN_FILE_SUCCESS: {
      const fileAvailability: FileAvailability = {
        id: action.validatedFile.id,
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

    case A.OPEN_FILE_FAILURE: {
      const base = state[action.file.type][action.file.id]
      const newAvailability: KnownFile = {
        id: action.file.id,
        filePath: base ? base.filePath : null,
        status: 'FAILED_TO_LOAD',
        isLoading: false,
      }
      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: newAvailability,
        },
      }
    }

    case A.ADD_FILE: {
      const newAvailability: KnownFile = action.filePath
        ? {
            filePath: action.filePath,
            status: 'PREVIOUSLY_LOADED',
            id: action.file.id,
            isLoading: false,
          }
        : {
            filePath: null,
            status: 'NEVER_LOADED',
            id: action.file.id,
            isLoading: false,
          }
      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: newAvailability,
        },
      }
    }
    case A.LOCATE_FILE_SUCCESS: {
      const base = state[action.file.type][action.file.id]
      const newAvailability: KnownFile = {
        status:
          base && base.status === 'CURRENTLY_LOADED'
            ? 'CURRENTLY_LOADED'
            : 'PREVIOUSLY_LOADED',
        id: action.file.id,
        isLoading: false,
        filePath: action.filePath,
      }

      return {
        ...state,
        [action.file.type]: {
          ...state[action.file.type],
          [action.file.id]: newAvailability,
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
