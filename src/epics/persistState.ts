import { ignoreElements, tap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { AppEpic } from '../types/AppEpic'

const persistStateEpic: AppEpic = (action$, state$, { setLocalStorage }) =>
  action$.pipe(
    ofType(A.OPEN_PROJECT, A.SET_MEDIA_FOLDER_LOCATION),
    tap(() => {
      setLocalStorage('settings', JSON.stringify(state$.value.settings))
      setLocalStorage('loadedFiles', JSON.stringify(state$.value.loadedFiles))
      setLocalStorage('fileRecords', JSON.stringify(state$.value.fileRecords))
    }),
    ignoreElements()
  )

export default persistStateEpic
