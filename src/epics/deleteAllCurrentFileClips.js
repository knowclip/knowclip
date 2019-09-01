// 2flow
import { map } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'

const deleteAllCurrentFileClips = (action$, state$) =>
  action$.pipe(
    ofType('DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST'),
    map(() =>
      r.doesCurrentFileHaveClips(state$.value)
        ? r.confirmationDialog(
            'Are you sure you want to delete all your work for this file?',
            r.deleteCards(
              r.getClipIdsByMediaFileId(
                state$.value,
                r.getCurrentFileId(state$.value)
              )
            )
          )
        : r.simpleMessageSnackbar(
            "You haven't made any clips/flashcards for this file yet."
          )
    )
  )

export default deleteAllCurrentFileClips
