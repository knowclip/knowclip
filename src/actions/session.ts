import A from '../types/ActionType'

export const sessionActions = {
  [A.dismissMedia]: () => ({ type: A.dismissMedia }),

  [A.toggleLoop]: (reason: LoopReason) => ({
    type: A.toggleLoop,
    reason,
  }),

  [A.setLoop]: (loop: LoopState) => ({
    type: A.setLoop,
    loop,
  }),

  [A.playMedia]: () => ({ type: A.playMedia }),
  [A.pauseMedia]: () => ({ type: A.pauseMedia }),

  [A.setViewMode]: (viewMode: ViewMode) => ({
    type: A.setViewMode,
    viewMode,
  }),
}
