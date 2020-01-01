import { ignoreElements, tap, filter } from 'rxjs/operators'
import { AppEpic } from '../types/AppEpic'

const isProjectFileAction = (action: Action) =>
  (action.type === A.OPEN_FILE_SUCCESS &&
    action.validatedFile.type === 'ProjectFile') ||
  (action.type === A.DELETE_FILE_SUCCESS &&
    action.file.type === 'ProjectFile') ||
  (action.type === A.LOCATE_FILE_SUCCESS && action.file.type === 'ProjectFile')

const persistStateEpic: AppEpic = (action$, state$, { setLocalStorage }) =>
  action$.pipe(
    filter(
      action =>
        [A.OPEN_PROJECT, A.SET_MEDIA_FOLDER_LOCATION].includes(action.type) ||
        isProjectFileAction(action)
    ),
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
