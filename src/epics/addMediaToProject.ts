import A from '../types/ActionType'
import { catchError, mergeAll, mergeMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import r from '../redux'

const addMediaToProject: AppEpic = (action$, _state$, effects) =>
  action$.pipe(
    ofType(A.addMediaToProjectRequest as const),
    mergeMap(({ projectId, filePaths }) =>
      Promise.all(
        filePaths.map(async (filePath) => {
          console.log(
            await window.electronApi.sendToMainProcess({
              type: 'getFfmpegAndFfprobePath',
              args: [],
            })
          )
          const file = await effects.readMediaFile(
            filePath,
            effects.uuid(),
            projectId
          )
          if (file.errors) throw file.errors.join('; ')
          else return r.openFileRequest(file.value, filePath)
        })
      )
    ),
    mergeAll(),
    catchError((err) => {
      console.error(err)
      return [r.simpleMessageSnackbar(`Error adding media file: ${err}`)]
    })
  )

export default addMediaToProject
