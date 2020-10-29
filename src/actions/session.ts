import * as A from '../types/ActionType'

export const dismissMedia = (): DismissMedia => ({ type: 'DISMISS_MEDIA' })

export const toggleLoop = (reason: LoopReason): ToggleLoop => ({
  type: A.TOGGLE_LOOP,
  reason,
})

export const setLoop = (loop: LoopState): SetLoop => ({
  type: A.SET_LOOP,
  loop,
})

export const playMedia = (): PlayMedia => ({ type: A.PLAY_MEDIA })
export const pauseMedia = (): PauseMedia => ({ type: A.PAUSE_MEDIA })

export const setViewMode = (viewMode: ViewMode): SetViewMode => ({
  type: A.SET_VIEW_MODE,
  viewMode,
})
