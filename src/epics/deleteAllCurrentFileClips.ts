import { of, EMPTY } from 'rxjs'
import { map, mergeMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import r from '../redux'
import A from '../types/ActionType'

const deleteAllCurrentFileClips: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType(A.deleteAllCurrentFileClipsRequest as const),
    mergeMap(() => {
      const currentFileId = r.getCurrentFileId(state$.value)
      return currentFileId ? of(currentFileId) : EMPTY
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
