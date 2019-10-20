import { Reducer } from 'redux'

export const initialState: LoadedFilesState = {}

const loadedFiles: Reducer<LoadedFilesState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.LOAD_FILE_SUCCESS:
      return {
        ...state,
        [action.fileRecord.id]: {
          ...(state[action.fileRecord.id] || null),
          filePath: action.filePath,
          loaded: true,
        },
      }
    default:
      return state
  }
}

export default loadedFiles
