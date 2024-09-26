import { ofType, combineEpics } from 'redux-observable'
import {
  filter,
  mergeMap,
  take,
  ignoreElements,
  endWith,
  concat,
} from 'rxjs/operators'
import { EMPTY, of } from 'rxjs'
import { actions } from '../actions'
import A from '../types/ActionType'
import { getClip, getCurrentMediaFile, getFile } from '../selectors'
import KnowclipActionType from '../types/ActionType'

const remakeStill: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType(A.editClip as const),
    mergeMap(({ flashcardOverride, id }) => {
      const clip = getClip(state$.value, id) as Clip
      const mediaFile = getCurrentMediaFile(state$.value)
      if (!(clip && mediaFile && mediaFile.isVideo)) return EMPTY

      const still = getFile<VideoStillImageFile>(
        state$.value,
        'VideoStillImage',
        clip.id
      )
      if (
        flashcardOverride &&
        still &&
        ('start' in flashcardOverride || 'end' in flashcardOverride)
      )
        return of(actions.deleteFileRequest(still.type, still.id)).pipe(
          concat(
            action$.pipe(
              filter(
                (a) =>
                  a.type === KnowclipActionType.deleteFileSuccess &&
                  a.file.id === still.id &&
                  a.file.type === still.type
              ),
              take(1),
              ignoreElements()
            )
          ),
          endWith(actions.openFileRequest(still))
        )

      return EMPTY
    })
  )

const setDefaultClipSpecs: AppEpic = (action$) =>
  action$.pipe(
    ofType(A.editClip as const),
    mergeMap(({ flashcardOverride }) => {
      if (!flashcardOverride) return EMPTY

      const { image } = flashcardOverride
      if (image === undefined) return EMPTY

      return of(
        actions.setDefaultClipSpecs({
          includeStill: image !== null,
        })
      )
    })
  )
export default combineEpics(remakeStill, setDefaultClipSpecs)
