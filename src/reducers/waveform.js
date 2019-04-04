// @flow

const initialState: WaveformState = {
  stepsPerSecond: 25,
  stepLength: 2,
  cursor: { x: 0, y: 0 },
  viewBox: { xMin: 0 },
  path: null,
}

const waveform: Reducer<WaveformState> = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_WAVEFORM_IMAGE_PATH':
      return {
        ...state,
        path: action.path,
      }

    case 'SET_CURSOR_POSITION': {
      return {
        ...state,
        cursor: {
          ...state.cursor,
          x: action.x,
        },
        viewBox: action.newViewBox || state.viewBox,
      }
    }

    case 'SET_WAVEFORM_VIEW_BOX':
      return {
        ...state,
        viewBox: action.viewBox,
      }

    default:
      return state
  }
}

export default waveform
