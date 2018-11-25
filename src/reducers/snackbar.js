// @flow

const initialState: SnackbarState = {
  queue: [],
}

export default function snackbar(
  state: SnackbarState = initialState,
  action: Object
): SnackbarState {
  switch (action.type) {
    case 'ENQUEUE_SNACKBAR':
      return {
        ...state,
        queue: state.queue.concat(action.snackbar),
      }

    case 'CLOSE_SNACKBAR': {
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
