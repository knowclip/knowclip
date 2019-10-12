import { Reducer } from 'redux'

const initialState: SnackbarState = {
  queue: [],
}

const snackbar: Reducer<SnackbarState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.ENQUEUE_SNACKBAR:
      return {
        ...state,
        queue: state.queue.concat(action.snackbar),
      }

    case A.CLOSE_SNACKBAR: {
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
