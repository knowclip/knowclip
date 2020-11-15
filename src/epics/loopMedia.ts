import r from '../redux'
import { filter, tap, ignoreElements } from 'rxjs/operators'

const loopMedia: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter(
      (a) =>
        Boolean(a.type === 'toggleLoop' && r.getLoopState(state$.value)) ||
        Boolean(a.type === 'setLoop' && a.loop)
    ),
    tap(() => {
      if (!effects.isMediaPlaying()) effects.playMedia()
    }),
    ignoreElements()
  )

export default loopMedia
