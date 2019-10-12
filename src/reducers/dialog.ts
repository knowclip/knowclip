import { Reducer } from 'redux'

const initialState: DialogState = {
  queue: [],
}

const dialog: Reducer<DialogState, Action> = (state = initialState, action) => {
  switch (action.type) {
    case A.ENQUEUE_DIALOG:
      return {
        ...state,
        queue: action.skipQueue
          ? [action.dialog, ...state.queue]
          : state.queue.concat(action.dialog),
      }

    case A.CLOSE_DIALOG: {
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
