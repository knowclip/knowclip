// @flow

const initialState: DialogState = {
  queue: [],
}

const dialog: Reducer<DialogState> = (
  state: DialogState = initialState,
  action: Object
) => {
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

export default dialog
