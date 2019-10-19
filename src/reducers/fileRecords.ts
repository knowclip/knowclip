import { Reducer } from 'redux'

export const initialState: FileRecordsState = { byId: {}, idsByBaseFileId: {} }

const fileRecords: Reducer<FileRecordsState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    default:
      return state
  }
}

export default fileRecords
