// @flow

const initialState: DialogState = {
  queue: [],
}

export default function dialog(
  state: DialogState = initialState,
  action: Object
): DialogState {
  switch (action.type) {
    case 'ENQUEUE_DIALOG':
      return {
        ...state,
        queue: state.queue.concat(action.dialog),
      }

    case 'CLOSE_DIALOG': {
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
