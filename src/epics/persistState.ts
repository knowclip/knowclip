import { ignoreElements, tap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { AppEpic } from '../types/AppEpic'

const persistStateEpic: AppEpic = (action$, state$, { setLocalStorage }) =>
  action$.pipe(
    ofType(
      A.OPEN_PROJECT,
      A.ADD_MEDIA_TO_PROJECT,
      A.DELETE_MEDIA_FROM_PROJECT,
      A.SET_MEDIA_FOLDER_LOCATION,
      A.LOAD_FILE_SUCCESS // should  be only on save project?
    ),
    tap(() => {
      setLocalStorage('settings', JSON.stringify(state$.value.settings))
      setLocalStorage('loadedFiles', JSON.stringify(state$.value.loadedFiles))
      setLocalStorage('fileRecords', JSON.stringify(state$.value.fileRecords))
    }),
    ignoreElements()
  )

export default persistStateEpic
