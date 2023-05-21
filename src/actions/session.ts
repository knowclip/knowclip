import A from '../types/ActionType'

export const sessionActions = {
  dismissMedia: () => ({ type: A.dismissMedia as const }),

  toggleLoop: (reason: LoopReason) => ({
    type: A.toggleLoop as const,
    reason,
  }),

  setLoop: (loop: LoopState) => ({
    type: A.setLoop as const,
    loop,
  }),

  setViewMode: (viewMode: ViewMode) => ({
    type: A.setViewMode as const,
    viewMode,
  }),
}
