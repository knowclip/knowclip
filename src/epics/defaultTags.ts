import { map } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'

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

export default combineEpics(defaultTagsEpic)
