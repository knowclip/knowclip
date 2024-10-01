import {
  mergeMap,
  tap,
  map,
  catchError,
  startWith,
  endWith,
  concatMap,
  filter,
  takeUntil,
  take,
  ignoreElements,
  switchMap,
  concatWith,
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { of, EMPTY, from, Observable, fromEvent, defer, merge } from 'rxjs'
import r from '../redux'

import { areSameFile } from '../utils/files'
import A from '../types/ActionType'
import type { DeckCreationErrorEvent } from '../node/writeToApkg'
import { ActionOf } from '../actions'

const exportApkgFailure: AppEpic = (action$) =>
  action$.pipe(
    ofType(A.exportApkgFailure as const),
    tap(() => (document.body.style.cursor = 'default')),
    mergeMap(({ errorMessage }) =>
      errorMessage
        ? of(
            r.simpleMessageSnackbar(
              `There was a problem making clips: ${errorMessage}`
            )
          )
        : EMPTY
    )
  )
const exportApkgSuccess: AppEpic = (action$) =>
  action$.pipe(
    ofType(A.exportApkgSuccess as const),
    tap(() => (document.body.style.cursor = 'default')),
    map(({ successMessage }) => r.simpleMessageSnackbar(successMessage))
  )

const exportApkg: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.exportApkgRequest as const),
    switchMap(async (exportApkgRequest) => {
      const { mediaFileIdsToClipIds } = exportApkgRequest

      const currentProject = r.getCurrentProject(state$.value)
      if (!currentProject)
        return of(r.exportApkgFailure('Could not find project'))

      const exportResult = await effects.getApkgExportData(
        state$.value,
        currentProject,
        mediaFileIdsToClipIds
      )

      if (exportResult.error) {
        return of(r.exportApkgFailure(`${exportResult.error.message}`))
      }

      if (exportResult.value.type === 'MISSING MEDIA FILES') {
        return getMissingMedia(
          exportResult.value.missingMediaFiles,
          action$,
          exportApkgRequest
        )
      }

      return makeApkg(exportResult.value.apkgData, effects)
    }),
    switchMap((x) => x)
  )

function makeApkg(
  exportData: ApkgExportData,
  { showSaveDialog, writeApkgDeck }: EpicsDependencies
) {
  return from(showSaveDialog('Anki APKG file', ['apkg'])).pipe(
    filter((path): path is string => Boolean(path)),
    mergeMap((outputFilePath) => {
      document.body.style.cursor = 'progress'

      let processed = 0
      const deckCreationEnded = merge(
        fromEvent(window, 'deck-creation-error').pipe(
          map((e) => {
            throw (e as DeckCreationErrorEvent).message
              ? new Error((e as DeckCreationErrorEvent).message)
              : new Error('Deck creation failed.')
          })
        ),
        fromEvent(window, 'deck-saved')
      ).pipe(
        tap((e) => {
          console.log('deck creation event', e)
        }),
        take(1)
      )
      return of(
        r.setProgress({
          percentage: 0,
          message: 'Processing clips...',
        })
      )
        .pipe(
          concatWith(
            fromEvent(window, 'clip-processed').pipe(
              takeUntil(deckCreationEnded),
              map(() => {
                console.log('heard clip-processed event')
                const number = ++processed
                return r.setProgress(
                  number < exportData.clips.length
                    ? {
                        percentage: (number / exportData.clips.length) * 100,
                        message: `${number} clips out of ${exportData.clips.length} processed`,
                      }
                    : {
                        percentage: 100,
                        message: 'Almost done! Saving .apkg file...',
                      }
                )
              }),
              concatWith(
                from([
                  r.exportApkgSuccess('Flashcards made in ' + outputFilePath),
                  r.setProgress(null),
                ])
              )
            )
          )
        )
        .pipe(
          doOnSubscribe(async () => {
            console.log('subscribed i guess!!', processed)
            await null
            writeApkgDeck(outputFilePath, exportData)
          })
        )
    }),
    catchError((err) => {
      console.error(err)
      return from([r.exportApkgFailure(String(err)), r.setProgress(null)])
    })
  )
}

function getMissingMedia(
  missingMediaFiles: Array<MediaFile>,
  action$: Observable<Action>,
  exportApkgRequest: ActionOf<A.exportApkgRequest>
) {
  const missingMediaFileIds = missingMediaFiles.map((file) => file.id)
  const openMissingMediaFailure = action$.pipe(
    ofType(A.openFileFailure as const),
    filter(
      (a) =>
        a.file.type === 'MediaFile' && missingMediaFileIds.includes(a.file.id)
    ),
    take(1)
  )
  return from(missingMediaFiles).pipe(
    concatMap((file) =>
      of(r.openFileRequest(file)).pipe(
        concatWith(
          action$.pipe(
            ofType(A.openFileSuccess as const),
            filter((a) => areSameFile(file, a.validatedFile)),
            take(1),
            ignoreElements()
          )
        )
      )
    ),
    startWith(r.closeDialog()),
    takeUntil(openMissingMediaFailure),
    endWith(
      r.reviewAndExportDialog(
        exportApkgRequest.mediaOpenPrior,
        exportApkgRequest.mediaFileIdsToClipIds
      )
    )
  )
}

export default combineEpics(exportApkg, exportApkgSuccess, exportApkgFailure)

function doOnSubscribe<T>(
  onSubscribe: () => void
): (source: Observable<T>) => Observable<T> {
  return function inner(source: Observable<T>): Observable<T> {
    return defer(() => {
      onSubscribe()
      return source
    })
  }
}
