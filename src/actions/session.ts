export const dismissMedia = (): DismissMedia => ({ type: 'DISMISS_MEDIA' })

export const toggleLoop = (): Action => ({
  type: A.TOGGLE_LOOP,
})

export const setLoop = (loop: boolean): Action => ({
  type: A.SET_LOOP,
  loop,
})

// TODO:
// playMedia
// pauseMedia
// toggleMediaPlaying
