import { ofType, combineEpics } from 'redux-observable'
import {
  filter,
  flatMap,
  take,
  ignoreElements,
  endWith,
  concat,
} from 'rxjs/operators'
import { empty, of } from 'rxjs'
import { actions } from '../actions'
import A from '../types/ActionType'
import { getClip, getCurrentMediaFile, getFile } from '../selectors'

const remakeStill: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, EditClip>(A.editClip),
    flatMap(({ flashcardOverride, id }) => {
      const clip = getClip(state$.value, id) as Clip
      const mediaFile = getCurrentMediaFile(state$.value)
      if (!(clip && mediaFile && mediaFile.isVideo)) return empty()

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
                  a.type === 'deleteFileSuccess' &&
                  a.file.id === still.id &&
                  a.file.type === still.type
              ),
              take(1),
              ignoreElements()
            )
          ),
          endWith(actions.openFileRequest(still))
        )

      return empty()
    })
  )

const setDefaultClipSpecs: AppEpic = (action$) =>
  action$.pipe(
    ofType<Action, EditClip>(A.editClip),
    flatMap(({ flashcardOverride }) => {
      if (!flashcardOverride) return empty()

      const { image } = flashcardOverride
      if (image === undefined) return empty()

      return of(
        actions.setDefaultClipSpecs({
          includeStill: image !== null,
        })
      )
    })
  )
export default combineEpics(remakeStill, setDefaultClipSpecs)
