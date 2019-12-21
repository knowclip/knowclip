import { Reducer } from 'redux'

export const initialState: LoadedFilesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  TemporaryVttFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  // VideoStillImage: {},
}

const loadedFiles: Reducer<LoadedFilesState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.LOAD_FILE_SUCCESS: {
      const loadedFile: LoadedFile = {
        ...state[action.validatedFileRecord.type][action.validatedFileRecord.id],
        status: 'CURRENTLY_LOADED',
        filePath: action.filePath,
      }
      return {
        ...state,
        [action.validatedFileRecord.type]: {
          ...state[action.validatedFileRecord.type],
          [action.validatedFileRecord.id]: loadedFile,
        },
      }
    }

    case A.ADD_AND_LOAD_FILE:
    case A.ADD_FILE:
    case A.LOCATE_FILE_SUCCESS: {
      if (!action.filePath) return state

      const currentFile =
        state[action.fileRecord.type][action.fileRecord.id] || null
      const loadedFile: LoadedFile = currentFile
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
          id: action.fileRecord.id,
        }
      return {
        ...state,
        [action.fileRecord.type]: {
          ...state[action.fileRecord.type],
          [action.fileRecord.id]: loadedFile,
        },
      }
    }

    default:
      return state
  }
}

export default loadedFiles
