import { Reducer } from 'redux'
import A from '../types/ActionType'

const initialState: SnackbarState = {
  queue: [],
}

const snackbar: Reducer<SnackbarState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.enqueueSnackbar:
      return state.queue.some(
        (snackbar) =>
          snackbar.type === action.snackbar.type &&
          JSON.stringify(action.snackbar.props) ===
            JSON.stringify(snackbar.props)
      )
        ? state
        : {
            ...state,
            queue: state.queue.concat(action.snackbar),
          }

    case A.closeSnackbar: {
      const [, ...queue] = state.queue
      return {
        ...state,
        queue,
      }
    }

    default:
      return state
  }
}

export default snackbar
