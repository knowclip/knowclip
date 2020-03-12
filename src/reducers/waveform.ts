import { Reducer } from 'redux'
import * as A from '../types/ActionType'

const initialState: WaveformState = {
  stepsPerSecond: 25,
  stepLength: 2,
  cursor: { x: 0, y: 0 },
  viewBox: { xMin: 0 },
  length: 0,
}

const waveform: Reducer<WaveformState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.SET_CURSOR_POSITION: {
      return {
        ...state,
        cursor: {
          ...state.cursor,
          x: action.x,
        },
        viewBox: action.newViewBox || state.viewBox,
      }
    }

    case A.SET_WAVEFORM_VIEW_BOX:
      return {
        ...state,
        viewBox: action.viewBox,
      }

    case A.OPEN_FILE_SUCCESS:
      return action.validatedFile.type === 'MediaFile'
        ? {
            ...state,
            length: ~~(
              action.validatedFile.durationSeconds *
              (state.stepsPerSecond * state.stepLength)
            ),
          }
        : state

    case A.DISMISS_MEDIA:
      return {
        ...state,
        length: 0,
      }

    case A.OPEN_FILE_REQUEST:
      return action.file.type === 'MediaFile'
        ? {
            ...state,
            length: 0,
          }
        : state

    default:
      return state
  }
}

export default waveform
