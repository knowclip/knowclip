import r from '../redux'
import { filter, tap, ignoreElements } from 'rxjs/operators'
import KnowclipActionType from '../types/ActionType'

const loopMedia: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter(
      (a) =>
        Boolean(
          a.type === KnowclipActionType.toggleLoop &&
            r.getLoopState(state$.value)
        ) || Boolean(a.type === KnowclipActionType.setLoop && a.loop)
    ),
    tap(() => {
      if (!effects.isMediaPlaying()) effects.playMedia()
    }),
    ignoreElements()
  )

export default loopMedia
