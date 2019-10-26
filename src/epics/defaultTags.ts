import { map } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { basename } from 'path'

const defaultTagsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddFlashcardTag | DeleteFlashcardTag>(
      A.ADD_FLASHCARD_TAG,
      A.DELETE_FLASHCARD_TAG
    ),
    map(({ id }) => {
      const clip = r.getClip(state$.value, id)
      if (!clip) {
        // should this happen or should we set empty default tags?
        console.error('No clip found')
        return r.simpleMessageSnackbar(
          'Could not set default tags: no clip found'
        )
      }
      return {
        type: 'SET_DEFAULT_TAGS',
        tags: clip.flashcard.tags,
      } as SetDefaultTags
    })
  )

// const onOpenMedia: AppEpic = (action$, state$) =>
//   action$.pipe(
//     ofType<Action, OpenMediaFileSuccess>(A.OPEN_MEDIA_FILE_SUCCESS),
//     map(action => {
//       const fileName = r.getCurrentFileName(state$.value)
//       return {
//         type: 'SET_DEFAULT_TAGS',
//         tags: fileName ? [basename(fileName)] : [],
//       } as SetDefaultTags
//     })
//   )

export default combineEpics(
  defaultTagsEpic
  //  onOpenMedia,
)
