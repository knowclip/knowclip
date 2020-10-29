import {
  switchMap,
  filter,
  take,
  ignoreElements,
  concatMap,
  concat,
} from 'rxjs/operators'
import r from '../redux'
import A from '../types/ActionType'
import { ofType } from 'redux-observable'
import { from, of } from 'rxjs'
import { areSameFile } from '../utils/files'

const generateWaveformImages: AppEpic = (action$) =>
  action$.pipe(
    ofType<Action, GenerateWaveformImages>(A.generateWaveformImages),
    switchMap((action) => {
      return from(action.waveformPngs).pipe(
        concatMap((file) => {
          return of(r.openFileRequest(file)).pipe(
            concat(
              action$.pipe(
                ofType<Action, OpenFileSuccess>('openFileSuccess'),
                filter((a) => areSameFile(file, a.validatedFile)),
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
