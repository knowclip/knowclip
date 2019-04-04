import { ignoreElements, tap } from 'rxjs/operators'
import { ofType } from 'redux-observable'

export const persistState = (state: AppState) => {
  window.localStorage.setItem('projects', JSON.stringify(state.projects))
}

const persistStateEpic = (action$, state$) =>
  action$.pipe(
    ofType(
      'OPEN_PROJECT',
      'ADD_MEDIA_TO_PROJECT',
      'DELETE_MEDIA_FROM_PROJECT',
      'OPEN_MEDIA_FILE_SUCCESS',
      'LOCATE_MEDIA_FILE_SUCCESS'
    ),
    tap(() => {
      persistState(state$.value)
    }),
    ignoreElements()
  )

export default persistStateEpic
