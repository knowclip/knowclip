import { AppEpic } from '../types/AppEpic'
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
import * as actions from '../actions'
import { getClip, getCurrentMediaFile, getFile } from '../selectors'
import { areSameFile } from '../utils/files'

const remakeStill: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, EditClip>(A.EDIT_CLIP),
    flatMap(({ override, id }) => {
      const clip = getClip(state$.value, id) as Clip
      const mediaFile = getCurrentMediaFile(state$.value)
      if (!(clip && mediaFile && mediaFile.isVideo)) return empty()

      const still = getFile<VideoStillImageFile>(
        state$.value,
        'VideoStillImage',
        clip.id
      )
      if (still && ('start' in override || 'end' in override))
        return of(actions.deleteFileRequest(still.type, still.id)).pipe(
          concat(
            action$.pipe(
              filter(
                a =>
                  a.type === 'DELETE_FILE_SUCCESS' &&
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

const setDefaultClipSpecs: AppEpic = action$ =>
  action$.pipe(
    ofType<Action, EditClip>(A.EDIT_CLIP),
    flatMap(({ override }) => {
      const { flashcard } = override
      if (!flashcard) return empty()

      const { image } = flashcard
      if (image === undefined) return empty()

      return of(
        actions.setDefaultClipSpecs({
          includeStill: image !== null,
        })
      )
    })
  )
export default combineEpics(remakeStill, setDefaultClipSpecs)
