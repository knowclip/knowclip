import { Reducer } from 'redux'

export const initialState: FileRecordsState = {
  // byId: {},
  // idsByBaseFileId: {},
  // byType: {
  ProjectFile: {},
  MediaFile: {},
  ExternalSubtitlesFile: {},
  TemporaryVttFile: {},
  WaveformPng: {},
  ConstantBitrateMp3: {},
  VideoStillImage: {},
  // },
}

const fileRecords: Reducer<FileRecordsState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.ADD_FILE:
      return {
        ...state,
        [action.fileRecord.type]: {
          ...state[action.fileRecord.type],
          [action.fileRecord.id]: action.fileRecord,
        },
      }
    default:
      return state
  }
}

export default fileRecords
