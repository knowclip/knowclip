import { combineEpics, ofType } from 'redux-observable'
import {
  catchError,
  concatMap,
  concatWith,
  count,
  filter,
  map,
  mergeMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators'
import A from '../types/ActionType'
import { ActionOf, actions } from '../actions'
import * as s from '../selectors'
import {
  deleteDictionary,
  newDictionary,
  resetDictionariesDatabase,
} from '../utils/dictionariesDatabase'
import { getFileFilters } from '../utils/files'
import { concat, defer, EMPTY, from, merge, of } from 'rxjs'
import { RehydrateAction } from 'redux-persist'
import { importYomichanEntries } from '../utils/dictionaries/importYomichanEntries'
import {
  ImportProgressPayload,
  ParseEndPayload,
} from '../utils/dictionaries/openDictionaryZip'
import { importCedictEntries } from '../utils/dictionaries/importCeDictEntries'
import { importDictCcEntries } from '../utils/dictionaries/importDictCcEntries'
import {
  importYomitanEntries,
  YomitanArchiveEntry,
} from '../utils/dictionaries/importYomitanEntries'
import { IndexableType } from 'dexie'

const initializeDictionaries: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType('persist/REHYDRATE' as any),
    filter((action) => (action as unknown as RehydrateAction).key === 'files'),
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
    ofType(A.importDictionaryRequest as const),
    mergeMap(async (action): Promise<Action> => {
      try {
        const files = await effects.showOpenDialog(getFileFilters('Dictionary'))

        if (!files || !files.length)
          return { type: 'NOOP' } as unknown as Action

        const [filePath] = files
        const dictionary = await newDictionary(
          effects.getDexieDb(),
          action.dictionary,
          filePath,
          effects.uuid()
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
    })
  )

const startImportEpic: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.startDictionaryImport as const),
    mergeMap(({ file, filePath }) => {
      let parseEndPayload: ParseEndPayload<typeof file> | null = null

      const importProgress = effects.fromIpcRendererEvent<
        ImportProgressPayload<typeof file, unknown>
      >('dictionary-import-progress')
      const parseEnd = effects
        .fromIpcRendererEvent<ParseEndPayload<typeof file>>(
          'dictionary-parse-end'
        )
        .pipe(
          take(1),
          tap((event) => {
            console.log('parse end event from epic', event)
            parseEndPayload = event.payload
          })
        )

      return merge(
        from([
          actions.setProgress({
            percentage: 0,
            message: 'Import in progress.',
          }),
          actions.addFile(file, filePath),
        ]),
        defer(() => {
          return effects.openDictionaryFile(file, filePath)
        }).pipe(
          concatMap((openResult) => {
            console.log('openResult', openResult)
            if (openResult.error) {
              console.log('openResult.error', openResult.error)
              throw new Error(
                `Problem opening dictionary file: ${openResult.error}`
              )
            }
            return EMPTY
          })
        ),
        importProgress.pipe(
          takeUntil(parseEnd),
          concatMap(async (event) => {
            console.log('import progress event!', event)
            const importProgressEventPayload = event.payload
            const { progressPercentage, message, data } =
              importProgressEventPayload

            if (data) await importDictionaryEntries(file, data)

            return actions.setProgress({
              percentage: progressPercentage,
              message: message,
            })
          }),
          concatWith(
            defer(async () => {
              console.log('parse end payload', parseEndPayload)
              if (!parseEndPayload) throw new Error('Dictionary import failed.')
              if (!parseEndPayload.success) {
                throw new Error(parseEndPayload.errors.join('; '))
              }
              return actions.setProgress({
                percentage: 100,
                message: 'Import complete.',
              })
            })
          )
        )
      ).pipe(
        concatWith(
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
        ),
        catchError((err) => {
          console.error('dictionary file import error', err)

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
  action$.pipe(
    ofType(A.deleteImportedDictionary as const),
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

const deleteDatabaseEpic: AppEpic = (action$, state$, _effects) =>
  action$.pipe(
    ofType(A.resetDictionariesDatabase as const),
    mergeMap(async () => {
      const dictionaryFiles = s.getRememberedDictionaryFiles(state$.value)
      await resetDictionariesDatabase()
      return dictionaryFiles
    }),
    mergeMap((dictionaryFiles) => {
      const deleteEndActions = action$.pipe(
        filter(
          (a): a is ActionOf<A.deleteFileSuccess | A.deleteFileRequest> =>
            a.type === A.deleteFileSuccess ||
            (a.type === A.deleteFileFailure &&
              dictionaryFiles.some((f) => f.id === a.file.id))
        ),
        take(dictionaryFiles.length)
      )

      return merge(
        of(
          ...dictionaryFiles.map((f) =>
            actions.deleteFileRequest(f.type, f.id)
          ),
          actions.setProgress({
            percentage: 0,
            message: 'Resetting dictionaries database.',
          })
        ),
        deleteEndActions.pipe(
          count(),
          map((deleteEndActionsCount) =>
            actions.setProgress({
              percentage: Math.round(
                (deleteEndActionsCount / dictionaryFiles.length) * 100
              ),
              message: `Deleted ${deleteEndActionsCount} of ${dictionaryFiles.length} dictionaries.`,
            })
          )
        )
      ).pipe(
        concatWith(
          of(
            actions.setProgress(null),
            actions.simpleMessageSnackbar('Dictionaries database reset.')
          )
        )
      )
    }),
    catchError((err) => {
      return from([
        actions.setProgress(null),
        actions.simpleMessageSnackbar(
          `Problem deleting dictionaries database: ${err}`
        ),
      ])
    })
  )

export default combineEpics(
  initializeDictionaries,
  importDictionaryRequestEpic,
  startImportEpic,
  deleteDatabaseEpic,
  deleteImportedDictionaryEpic
)

function importDictionaryEntries(
  file: DictionaryFile,
  data: unknown
): Promise<IndexableType> {
  switch (file.dictionaryType) {
    case 'YomichanDictionary':
      return importYomichanEntries(data as string, file)
    case 'CEDictDictionary':
      return importCedictEntries(data as string, file)
    case 'DictCCDictionary':
      return importDictCcEntries(data as string, file)
    case 'YomitanDictionary':
      return importYomitanEntries(data as YomitanArchiveEntry, file)
  }
}
