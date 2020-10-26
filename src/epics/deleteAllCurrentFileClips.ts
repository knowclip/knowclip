import { of, empty } from 'rxjs'
import { map, flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import * as A from '../types/ActionType'

const deleteAllCurrentFileClips: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, DeleteAllCurrentFileClipsRequest>(
      A.DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST
    ),
    flatMap(() => {
      const currentFileId = r.getCurrentFileId(state$.value)
      return currentFileId ? of(currentFileId) : empty()
    }),
    map((currentFileId) =>
      r.doesCurrentFileHaveClips(state$.value)
        ? r.confirmationDialog(
            'Are you sure you want to delete all your work for this file?',
            r.deleteCards(
              r.getClipIdsByMediaFileId(state$.value, currentFileId)
            )
          )
        : r.simpleMessageSnackbar(
            "You haven't made any clips/flashcards for this file yet."
          )
    )
  )

export default deleteAllCurrentFileClips
