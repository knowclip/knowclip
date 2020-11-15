import A from '../types/ActionType'
import { catchError, mergeAll, flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import r from '../redux'
import { readMediaFile } from '../utils/ffmpeg'
import { uuid } from '../utils/sideEffects'
import { ActionOf } from '../actions'

const addMediaToProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, ActionOf<'addMediaToProjectRequest'>>(
      A.addMediaToProjectRequest
    ),
    flatMap<ActionOf<'addMediaToProjectRequest'>, Promise<Array<Action>>>(
      ({ projectId, filePaths }) =>
        Promise.all(
          filePaths.map(async (filePath) => {
            const file = await readMediaFile(filePath, uuid(), projectId)
            if (file.errors) throw file.errors.join('; ')
            else return r.openFileRequest(file.value, filePath)
          })
        )
    ),
    mergeAll(),
    catchError((err) => {
      console.log(err)
      return [r.simpleMessageSnackbar(`Error adding media file: ${err}`)]
    })
  )

export default addMediaToProject
