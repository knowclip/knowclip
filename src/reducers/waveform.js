import getViewbox from '../utils/getWaveformViewbox'

const initialState = {
  path: null,
  cursor: { x: 0, y: 0 },
  viewbox: getViewbox()
}

export default function waveform(state = initialState, action) {
  switch (action.type) {
    case 'SET_WAVEFORM_PATH':
      return {
        ...state,
        path: action.path,
      }

    case 'SET_CURSOR_POSITION':
      return {
        ...state,
        cursor: {
          ...state.cursor,
          x: action.x,
        }
      }

    default:
      return state
  }
}
