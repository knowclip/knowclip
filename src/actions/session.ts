import A from '../types/ActionType'

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

  playMedia: () => ({ type: A.playMedia }),
  pauseMedia: () => ({ type: A.pauseMedia }),

  setViewMode: (viewMode: ViewMode) => ({
    type: A.setViewMode,
    viewMode,
  }),
}
