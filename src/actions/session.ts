import A from '../types/ActionType'
import { KnowclipActionCreatorsSubset } from '.'

export const sessionActions = {
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
} satisfies KnowclipActionCreatorsSubset
