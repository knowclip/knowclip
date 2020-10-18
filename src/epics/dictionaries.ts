import { combineEpics, ofType } from 'redux-observable'
import { catchError, filter, flatMap, map } from 'rxjs/operators'
import * as A from '../types/ActionType'
import * as actions from '../actions'
import * as s from '../selectors'
import {
  deleteDictionary,
  newDictionary,
  resetDictionariesDatabase,
} from '../utils/dictionariesDatabase'
import { getFileFilters } from '../utils/files'
import { concat, from, of } from 'rxjs'
import { parseYomichanZip } from '../utils/dictionaries/parseYomichanZip'
import { parseCedictZip } from '../utils/dictionaries/parseCedictZip'
import { parseDictCCZip } from '../utils/dictionaries/parseDictCCZip'
import { RehydrateAction } from 'redux-persist'

const initializeDictionaries: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType('persist/REHYDRATE' as any),
    filter(action => ((action as unknown) as RehydrateAction).key === 'files'),
    flatMap(_rehydrated => {
      // TODO: investigate if it would be better to get these from indexed DB dictionaries table instead
      const dicts = Object.entries({
        ...state$.value.fileAvailabilities.YomichanDictionary,
        ...state$.value.fileAvailabilities.DictCCDictionary,
        ...state$.value.fileAvailabilities.CEDictDictionary,
      })
      const openFileActions = dicts.flatMap(
        ([id, fileAvailability]): Action[] => {
          if (!fileAvailability) {
            console.error('Problem initializing dictionaries')
            return []
          }
          const file = s.getFile(
            state$.value,
            fileAvailability.type as DictionaryFileType,
            id
          )
          if (!file) {
            console.error(`Missing file:`)
            console.error(fileAvailability)
            const snackbarAction: Action = actions.promptSnackbar(
              'There was a problem initializing dictionaries. Try restarting the app, or deleting the dictionaries database.',
              [['dictionary settings', actions.dictionariesDialog()]]
            )
            return [snackbarAction]
          }

          return [
            actions.openFileRequest(
              file as DictionaryFile,
              fileAvailability.filePath
            ),
          ]
        }
      )
      console.log({ openFileActions, dicts })

      return from(openFileActions)
    })
  )

const importDictionaryRequestEpic: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, ImportDictionaryRequest>(A.IMPORT_DICTIONARY_REQUEST),
    flatMap(
      async (action): Promise<Action> => {
        try {
          const files = await effects.electron.showOpenDialog(
            getFileFilters(action.dictionaryType)
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

          // also progress
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
    flatMap(({ file, filePath }) => {
      return concat(
        from([
          actions.setProgress({
            percentage: 50,
            message: 'Import in progress.',
          }),
          actions.addFile(file, filePath),
        ]),
        from(parseAndImportDictionary(file, filePath, effects)).pipe(
          flatMap(() => {
            return from([
              actions.finishDictionaryImport(file.type, file.id),
              actions.openFileRequest(file, filePath),
              actions.setProgress(null),
              actions.addActiveDictionary(file.id, file.type),
              actions.simpleMessageSnackbar(
                `Mouse over flashcard text and press the 'D' key to look up words.`,
                null
              ),
            ])
          }),
          catchError(err => {
            console.error(err)

            return from([
              actions.openFileFailure(file, filePath, String(err)),
              actions.simpleMessageSnackbar(
                `There was a problem importing this dictionary file: ${err}`
              ),
              // actions.setProgress(null),
              actions.deleteImportedDictionary(file),
            ])
          })
        )
      )
    })
  )

function parseAndImportDictionary(
  file: DictionaryFile,
  filePath: string,
  effects: EpicsDependencies
) {
  switch (file.type) {
    case 'YomichanDictionary':
      return parseYomichanZip(file, filePath, effects)
    case 'CEDictDictionary':
      return parseCedictZip(file, filePath, effects)
    case 'DictCCDictionary':
      return parseDictCCZip(file, filePath, effects)
  }
}

const deleteImportedDictionaryEpic: AppEpic = (action$, state$, effects) =>
  action$.ofType<DeleteImportedDictionary>(A.DELETE_IMPORTED_DICTIONARY).pipe(
    flatMap(action => {
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
            s.getOpenDictionaryFiles(state$.value).map(d => d.file),
            action.file.key,
            action.file.type
          )
        ).pipe(
          flatMap(() => {
            return from([
              actions.setProgress(null),
              actions.deleteFileSuccess(
                s.getFileAvailability(state$.value, action.file),
                []
              ),
            ])
          }),
          catchError(err => {
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
    flatMap(() => {
      return from(resetDictionariesDatabase()).pipe(
        flatMap(() => {
          return [
            ...s
              .getRememberedDictionaryFiles(state$.value)
              .map(f => actions.deleteFileRequest(f.type, f.id)),
            actions.simpleMessageSnackbar(
              'Dictionaries database was successfully reset.'
            ),
          ]
        }),
        catchError(err => {
          return of(
            actions.simpleMessageSnackbar(
              `Problem deleting dictionaries database: ${err}`
            )
          )
        })
      )
    })
  )

function onZipArchiveEntry(filePath: string, callback: Function) {
  // return new Promise((res, reject) => {
  //   yauzl.open(filePath, { lazyEntries: true }, function(err, zipfile) {
  //     if (err) return reject(err)
  //     if (!zipfile) throw new Error('problem reading zip file')
  //     const rejectAndClose = (err: any) => {
  //       rejectAndClose(err)
  //       zipfile.close()
  //     }
  //     // let cache: StemsCache = {}
  //     let total = 0
  //     zipfile.on('entry', entry => {
}

export default combineEpics(
  initializeDictionaries,
  importDictionaryRequestEpic,
  startImportEpic,
  deleteDatabaseEpic,
  deleteImportedDictionaryEpic
)
