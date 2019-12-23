import { flatMap, catchError, mergeAll } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import { readMediaFileRecord } from '../utils/ffmpeg'
import uuid from 'uuid/v4'
import { AppEpic } from '../types/AppEpic'

const addMediaToProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddMediaToProjectRequest>(A.ADD_MEDIA_TO_PROJECT_REQUEST),
    flatMap<AddMediaToProjectRequest, Promise<Array<Action>>>(
      ({ projectId, filePaths }) =>
        Promise.all(
          filePaths.map(async filePath =>
            r.addAndLoadFile(
              await readMediaFileRecord(filePath, uuid(), projectId),
              filePath
            )
          )
        )
    ),
    mergeAll(),
    catchError(err => {
      console.log(err)
      return [
        r.simpleMessageSnackbar(`Error adding media file: ${err.message}`),
      ]
    })
  )

export default addMediaToProject
