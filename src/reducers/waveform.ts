import { Reducer } from 'redux'

const initialState: WaveformState = {
  stepsPerSecond: 25,
  stepLength: 2,
  cursor: { x: 0, y: 0 },
  viewBox: { xMin: 0 },
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

    default:
      return state
  }
}

export default waveform
