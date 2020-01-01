import { Reducer } from 'redux'

export const initialState: FileAvailabilitiesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  VttConvertedSubtitlesFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  // VideoStillImage: {},
}

const fileAvailabilities: Reducer<FileAvailabilitiesState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.OPEN_FILE_SUCCESS: {
      const fileAvailability: FileAvailability = {
        ...state[action.validatedFile.type][action.validatedFile.id],
        status: 'CURRENTLY_LOADED',
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

    case A.ADD_AND_OPEN_FILE:
    case A.ADD_FILE:
    case A.LOCATE_FILE_SUCCESS: {
      if (!action.filePath) return state

      const currentFile = state[action.file.type][action.file.id] || null
      const fileAvailability: FileAvailability = currentFile
        ? {
            ...currentFile,
            status:
              currentFile.status === 'NOT_LOADED'
                ? 'REMEMBERED'
                : currentFile.status,
            filePath: action.filePath,
          }
        : {
            filePath: action.filePath,
            status: 'CURRENTLY_LOADED',
            id: action.file.id,
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
      return { ...state, [action.file.type]: newSubstate }
    }

    default:
      return state
  }
}

export default fileAvailabilities
