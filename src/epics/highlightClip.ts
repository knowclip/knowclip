import { map, filter } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import A from '../types/ActionType'
import r from '../redux'

const deselectOnOpenMediaFile: AppEpic = (action$) =>
  action$.pipe(
    ofType(A.openFileRequest),
    filter(({ file }) => file.type === 'MediaFile'),
    map(() => r.selectWaveformItem(null))
  )

export default combineEpics(deselectOnOpenMediaFile)
