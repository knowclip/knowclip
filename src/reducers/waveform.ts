import { Reducer } from 'redux'
import A from '../types/ActionType'

const initialState: WaveformState = {
  stepsPerSecond: 25,
  stepLength: 1,
  cursor: { x: 0, y: 0 },
  viewBox: { xMin: 0 },
  length: 0,
}

const waveform: Reducer<WaveformState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.setCursorPosition: {
      return {
        ...state,
        cursor: {
          ...state.cursor,
          x: action.x,
        },
        viewBox: action.newViewBox || state.viewBox,
      }
    }

    case A.setWaveformViewBox:
      return {
        ...state,
        viewBox: action.viewBox,
      }

    case A.openFileSuccess:
      return action.validatedFile.type === 'MediaFile'
        ? {
            ...state,
            length: ~~(
              action.validatedFile.durationSeconds *
              (state.stepsPerSecond * state.stepLength)
            ),
          }
        : state

    case A.dismissMedia:
      return {
        ...state,
        length: 0,
      }

    case A.openFileRequest:
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
