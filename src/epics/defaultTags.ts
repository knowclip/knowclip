import { map } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import * as A from '../types/ActionType'

const defaultTagsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddFlashcardTag | DeleteFlashcardTag>(
      A.ADD_FLASHCARD_TAG,
      A.DELETE_FLASHCARD_TAG
    ),
    map(({ id }) => {
      const flashcard = r.getFlashcard(state$.value, id)
      if (!flashcard) {
        // should this happen or should we set empty default tags?
        console.error('No clip found')
        return r.simpleMessageSnackbar(
          'Could not set default tags: no clip found'
        )
      }
      return r.setDefaultClipSpecs({ tags: flashcard.tags })
    })
  )

export default combineEpics(defaultTagsEpic)
