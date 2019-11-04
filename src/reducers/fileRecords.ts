import { Reducer } from 'redux'
import { HIDE_SUBTITLES } from '../types/ActionType'

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
    case A.ADD_SUBTITLES_TRACK:
      return {
        ...state,
        MediaFile: {
          ...state.MediaFile,
          [action.track.mediaFileId]: {
            ...state.MediaFile[action.track.mediaFileId],
            subtitles: [
              ...state.MediaFile[action.track.mediaFileId].subtitles,
              action.track.id,
            ],
          },
        },
      }
    default:
      return state
  }
}

export default fileRecords
