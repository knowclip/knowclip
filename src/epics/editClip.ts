import { AppEpic } from '../types/AppEpic'
import { ofType } from 'redux-observable'
import {
  filter,
  map,
  flatMap,
  takeUntil,
  take,
  ignoreElements,
  endWith,
  concat,
} from 'rxjs/operators'
import { empty, of } from 'rxjs'
import { deleteFileRequest, addAndOpenFile } from '../actions'
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
        return of(deleteFileRequest(still.type, still.id)).pipe(
          concat(
            action$.pipe(
              filter(
                a =>
                  a.type === 'DELETE_FILE_SUCCESS' && areSameFile(a.file, still)
              ),
              take(1),
              ignoreElements()
            )
          ),
          endWith(addAndOpenFile(still))
        )

      return empty()
    })
  )

export default remakeStill
