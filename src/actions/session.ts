import A from '../types/ActionType'
import { defineActionCreators } from './defineActionCreators'

export const sessionActions = defineActionCreators({
  dismissMedia: () => ({ type: A.dismissMedia }),

  toggleLoop: (reason: LoopReason) => ({
    type: A.toggleLoop,
    reason,
  }),

  setLoop: (loop: LoopState) => ({
    type: A.setLoop,
    loop,
  }),

  setViewMode: (viewMode: ViewMode) => ({
    type: A.setViewMode,
    viewMode,
  }),
})
