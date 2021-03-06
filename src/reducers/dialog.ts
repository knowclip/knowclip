import { Reducer } from 'redux'
import A from '../types/ActionType'

const initialState: DialogState = {
  queue: [],
}

const dialog: Reducer<DialogState, Action> = (state = initialState, action) => {
  switch (action.type) {
    case A.enqueueDialog:
      return {
        ...state,
        queue: action.skipQueue
          ? [action.dialog, ...state.queue]
          : state.queue.concat(action.dialog),
      }

    case A.closeDialog: {
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
