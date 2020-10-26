import * as r from '../redux'
import { filter, tap, ignoreElements } from 'rxjs/operators'

const loopMedia: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter(
      (a) =>
        (a.type === 'TOGGLE_LOOP' && r.isLoopOn(state$.value)) ||
        (a.type === 'SET_LOOP' && a.loop)
    ),
    tap(() => {
      if (!effects.isMediaPlaying()) effects.playMedia()
    }),
    ignoreElements()
  )

export default loopMedia
