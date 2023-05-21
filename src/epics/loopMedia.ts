import r from '../redux'
import { filter, tap, ignoreElements } from 'rxjs/operators'
import ActionType from '../types/ActionType'

const loopMedia: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter(
      (a) =>
        Boolean(
          a.type === ActionType.toggleLoop && r.getLoopState(state$.value)
        ) || Boolean(a.type === ActionType.setLoop && a.loop)
    ),
    tap(() => {
      if (!effects.isMediaPlaying()) effects.playMedia()
    }),
    ignoreElements()
  )

export default loopMedia
