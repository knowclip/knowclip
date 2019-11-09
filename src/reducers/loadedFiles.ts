import { Reducer } from 'redux'

export const initialState: LoadedFilesState = {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  TemporaryVttFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  VideoStillImage: {},
}

const loadedFiles: Reducer<LoadedFilesState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    // case A.LOAD_FILE_SUCCESS:
    //   return {
    //     ...state,
    //     [action.fileRecord.id]: {
    //       ...(state[action.fileRecord.id] || null),
    //       filePath: action.filePath,
    //       loaded: true,
    //     },
    //   }

    case A.ADD_FILE: {
      const loadedFile: LoadedFile = action.filePath
        ? {
            id: action.fileRecord.id,
            status: 'REMEMBERED',
            filePath: action.filePath,
          }
        : {
            id: action.fileRecord.id,
            status: 'NOT_LOADED',
            filePath: null,
          }

      return {
        ...state,
        [action.fileRecord.type]: {
          ...state[action.fileRecord.type],
          [action.fileRecord.id]: loadedFile,
        },
      }
    }

    case A.LOAD_FILE_SUCCESS: {
      const loadedFile: LoadedFile = {
        ...state[action.fileRecord.type][action.fileRecord.id],
        status: 'CURRENTLY_LOADED',
        filePath: action.filePath,
      }
      return {
        ...state,
        [action.fileRecord.type]: {
          ...state[action.fileRecord.type],
          [action.fileRecord.id]: loadedFile,
        },
      }
    }

    case A.LOCATE_FILE_SUCCESS: {
      const currentFile = state[action.fileRecord.type][action.fileRecord.id]
      const loadedFile: LoadedFile = {
        ...currentFile,
        status:
          currentFile.status === 'NOT_LOADED'
            ? 'REMEMBERED'
            : currentFile.status,
        filePath: action.filePath,
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
