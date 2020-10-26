import { combineEpics, ofType } from 'redux-observable'
import { catchError, filter, mergeMap } from 'rxjs/operators'
import * as A from '../types/ActionType'
import * as actions from '../actions'
import * as s from '../selectors'
import {
  deleteDictionary,
  newDictionary,
  resetDictionariesDatabase,
} from '../utils/dictionariesDatabase'
import { getFileFilters } from '../utils/files'
import { concat, EMPTY, from, of } from 'rxjs'
import { RehydrateAction } from 'redux-persist'

const initializeDictionaries: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType('persist/REHYDRATE' as any),
    filter(
      (action) => ((action as unknown) as RehydrateAction).key === 'files'
    ),
    mergeMap((_rehydrated) => {
      // TODO: investigate if it would be better to get these from indexed DB dictionaries table instead
      const dicts = Object.entries(state$.value.fileAvailabilities.Dictionary)
      const openFileActions = dicts.flatMap(
        ([id, fileAvailability]): Action[] => {
          if (!fileAvailability) {
            console.error('Problem initializing dictionaries')
            return []
          }
          const file = s.getFile(state$.value, fileAvailability.type, id)
          if (!file) {
            console.error(`Missing file:`)
            console.error(fileAvailability)
            const snackbarAction: Action = actions.promptSnackbar(
              'There was a problem initializing dictionaries. Try restarting the app, or deleting the dictionaries database.',
              [['dictionary settings', actions.dictionariesDialog()]]
            )
            return [snackbarAction]
          }

          return [actions.openFileRequest(file, fileAvailability.filePath)]
        }
      )
      return from(openFileActions)
    })
  )

const importDictionaryRequestEpic: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, ImportDictionaryRequest>(A.IMPORT_DICTIONARY_REQUEST),
    mergeMap(
      async (action): Promise<Action> => {
        try {
          const files = await effects.electron.showOpenDialog(
            getFileFilters('Dictionary')
          )

          if (!files || !files.length)
            return ({ type: 'NOOP' } as unknown) as Action

          const [filePath] = files
          const dictionary = await newDictionary(
            effects.getDexieDb(),
            action.dictionaryType,
            filePath
          )
          if (s.isWorkUnsaved(state$.value))
            return actions.simpleMessageSnackbar(
              `Please save your work before trying to import a dictionary.`
            )

          return actions.startDictionaryImport(dictionary, filePath)
        } catch (err) {
          return actions.errorDialog(
            `There was a problem importing your dictionary: ${err}`,
            String(err)
          )
        }
      }
    )
  )

const startImportEpic: AppEpic = (action$, state$, effects) =>
  action$.ofType<StartDictionaryImport>(A.START_DICTIONARY_IMPORT).pipe(
    mergeMap(({ file, filePath }) => {
      return concat(
        from([
          actions.setProgress({
            percentage: 0,
            message: 'Import in progress.',
          }),
          actions.addFile(file, filePath),
        ]),
        from(effects.parseAndImportDictionary(file, filePath)).pipe(
          mergeMap((obs) =>
            obs.pipe(
              mergeMap((decimal) => {
                const newPercentage = Math.round(decimal * 100)
                const { progress } = state$.value.session
                if (progress && progress.percentage !== newPercentage)
                  return of(
                    actions.setProgress({
                      percentage: newPercentage,
                      message: 'Import in progress',
                    })
                  )

                return EMPTY
              })
            )
          )
        ),
        from([
          actions.finishDictionaryImport(file.id),
          actions.openFileRequest(file, filePath),
          actions.setProgress(null),
          actions.addActiveDictionary(file.id, file.dictionaryType),
          actions.simpleMessageSnackbar(
            `Mouse over flashcard text and press the 'D' key to look up words.`,
            null
          ),
        ])
      ).pipe(
        catchError((err) => {
          console.error(err)

          return from([
            actions.openFileFailure(file, filePath, String(err)),
            actions.simpleMessageSnackbar(
              `There was a problem importing this dictionary file: ${err}`
            ),
            // happens within deleteImportedDictionary:
            // actions.setProgress(null),
            actions.deleteImportedDictionary(file),
          ])
        })
      )
    })
  )

const deleteImportedDictionaryEpic: AppEpic = (action$, state$, effects) =>
  action$.ofType<DeleteImportedDictionary>(A.DELETE_IMPORTED_DICTIONARY).pipe(
    mergeMap((action) => {
      return concat(
        of(
          actions.setProgress({
            percentage: 50,
            message: 'Dictionary deletion in progress.',
          })
        ),
        from(
          deleteDictionary(
            effects,
            s.getOpenDictionaryFiles(state$.value).map((d) => d.file),
            action.file.key,
            action.file.dictionaryType
          )
        ).pipe(
          mergeMap(() => {
            return from([
              actions.setProgress(null),
              actions.deleteFileSuccess(
                s.getFileAvailability(state$.value, action.file),
                []
              ),
            ])
          }),
          catchError((err) => {
            console.error(err)

            return from([
              actions.simpleMessageSnackbar(
                `There was a problem deleting the dictionary file. If the problem persists, you may want to try deleting the entire dictionaries database.`
              ),
              actions.setProgress(null),
            ])
          })
        )
      )
    })
  )

const deleteDatabaseEpic: AppEpic = (action$, state$, effects) =>
  action$.ofType(A.RESET_DICTIONARIES_DATABASE).pipe(
    mergeMap(() => {
      return from(resetDictionariesDatabase()).pipe(
        mergeMap(() => {
          return [
            ...s
              .getRememberedDictionaryFiles(state$.value)
              .map((f) => actions.deleteFileRequest(f.type, f.id)),
            actions.simpleMessageSnackbar(
              'Dictionaries database was successfully reset.'
            ),
          ]
        }),
        catchError((err) => {
          return of(
            actions.simpleMessageSnackbar(
              `Problem deleting dictionaries database: ${err}`
            )
          )
        })
      )
    })
  )

export default combineEpics(
  initializeDictionaries,
  importDictionaryRequestEpic,
  startImportEpic,
  deleteDatabaseEpic,
  deleteImportedDictionaryEpic
)
