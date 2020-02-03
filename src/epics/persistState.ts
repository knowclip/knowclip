import { ignoreElements, tap } from 'rxjs/operators'
import { AppEpic } from '../types/AppEpic'
import { ofType, combineEpics } from 'redux-observable'

const persistStateEpic: AppEpic = (action$, state$, { setLocalStorage }) =>
  action$.pipe(
    ofType(A.OPEN_PROJECT, A.SAVE_PROJECT_REQUEST, A.SAVE_PROJECT_AS_REQUEST),
    tap(() => {
      setLocalStorage('settings', JSON.stringify(state$.value.settings))
      setLocalStorage(
        'fileAvailabilities',
        JSON.stringify(state$.value.fileAvailabilities)
      )
      // setLocalStorage('files', JSON.stringify(state$.value.files))
    }),
    ignoreElements()
  )

const persistFileAvailabilities: AppEpic = (
  action$,
  state$,
  { setLocalStorage }
) =>
  action$.pipe(
    ofType(A.OPEN_FILE_SUCCESS, A.LOCATE_FILE_SUCCESS),
    tap(() => {
      setLocalStorage(
        'fileAvailabilities',
        JSON.stringify(state$.value.fileAvailabilities)
      )
    }),
    ignoreElements()
  )

const persistSettingsEpic: AppEpic = (action$, state$, { setLocalStorage }) =>
  action$.pipe(
    ofType(A.SET_MEDIA_FOLDER_LOCATION),
    tap(() => {
      setLocalStorage('settings', JSON.stringify(state$.value.settings))
    }),
    ignoreElements()
  )

export default combineEpics(
  persistStateEpic,
  persistFileAvailabilities,
  persistSettingsEpic
)
