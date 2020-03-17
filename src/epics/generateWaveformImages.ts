import {
  switchMap,
  expand,
  filter,
  take,
  ignoreElements,
  concatMap,
  concat,
} from 'rxjs/operators'
import * as r from '../redux'
import * as A from '../types/ActionType'
import { ofType } from 'redux-observable'
import { from, of } from 'rxjs'
import { areSameFile } from '../utils/files'

const generateWaveformImages: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, GenerateWaveformImages>(A.GENERATE_WAVEFORM_IMAGES),
    switchMap(action => {
      return from(action.waveformPngs).pipe(
        concatMap(file => {
          return of(r.openFileRequest(file)).pipe(
            concat(
              action$.pipe(
                ofType<Action, OpenFileSuccess>('OPEN_FILE_SUCCESS'),
                filter(a => areSameFile(file, a.validatedFile)),
                take(1),
                ignoreElements()
              )
            )
          )
        })
      )
    })
  )

export default generateWaveformImages
