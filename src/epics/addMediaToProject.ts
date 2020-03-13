import * as A from '../types/ActionType'
import { catchError, mergeAll, flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import { readMediaFile } from '../utils/ffmpeg'
import { uuid } from '../utils/sideEffects'

const addMediaToProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddMediaToProjectRequest>(A.ADD_MEDIA_TO_PROJECT_REQUEST),
    flatMap<AddMediaToProjectRequest, Promise<Array<Action>>>(
      ({ projectId, filePaths }) =>
        Promise.all(
          filePaths.map(async filePath => {
            const file = await readMediaFile(filePath, uuid(), projectId)
            if (file.errors) throw file.errors.join('; ')
            else return r.openFileRequest(file.value, filePath)
          })
        )
    ),
    mergeAll(),
    catchError(err => {
      console.log(err)
      return [r.simpleMessageSnackbar(`Error adding media file: ${err}`)]
    })
  )

export default addMediaToProject
