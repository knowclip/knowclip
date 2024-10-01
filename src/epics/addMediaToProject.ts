import A from '../types/ActionType'
import { catchError, mergeAll, mergeMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import r from '../redux'
import { readMediaFile } from 'preloaded/ffmpeg'
import { uuid } from '../utils/sideEffects'

const addMediaToProject: AppEpic = (action$, _state$) =>
  action$.pipe(
    ofType(A.addMediaToProjectRequest as const),
    mergeMap(({ projectId, filePaths }) =>
      Promise.all(
        filePaths.map(async (filePath) => {
          const file = await readMediaFile(filePath, uuid(), projectId)
          if (file.error) throw file.error
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
