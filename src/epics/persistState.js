import { ignoreElements, tap } from 'rxjs/operators'
import { ofType } from 'redux-observable'

const persistStateEpic = (action$, state$, { setLocalStorage }) =>
  action$.pipe(
    ofType(
      'OPEN_PROJECT',
      'ADD_MEDIA_TO_PROJECT',
      'DELETE_MEDIA_FROM_PROJECT',
      'OPEN_MEDIA_FILE_SUCCESS',
      'LOCATE_MEDIA_FILE_SUCCESS',
      'SET_MEDIA_FOLDER_LOCATION'
    ),
    tap(() => {
      setLocalStorage('projects', JSON.stringify(state$.value.projects))
      setLocalStorage('audio', JSON.stringify(state$.value.audio))
    }),
    ignoreElements()
  )

export default persistStateEpic
