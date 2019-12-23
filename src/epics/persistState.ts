import { ignoreElements, tap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { AppEpic } from '../types/AppEpic'

const persistStateEpic: AppEpic = (action$, state$, { setLocalStorage }) =>
  action$.pipe(
    ofType(A.OPEN_PROJECT, A.SET_MEDIA_FOLDER_LOCATION),
    tap(() => {
      setLocalStorage('settings', JSON.stringify(state$.value.settings))
      setLocalStorage(
        'fileAvailabilities',
        JSON.stringify(state$.value.fileAvailabilities)
      )
      setLocalStorage('files', JSON.stringify(state$.value.files))
    }),
    ignoreElements()
  )

export default persistStateEpic
