import { Reducer } from 'redux'

export const initialState: LoadedFilesState = {}

const loadedFiles: Reducer<LoadedFilesState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    default:
      return state
  }
}

export default loadedFiles
