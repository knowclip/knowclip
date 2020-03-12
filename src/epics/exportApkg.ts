import {
  flatMap,
  tap,
  map,
  catchError,
  mergeAll,
  startWith,
  endWith,
  concat,
  concatMap,
  filter,
  takeUntil,
  take,
  ignoreElements,
  switchMap,
} from 'rxjs/operators'
import { ofType, combineEpics, ActionsObservable } from 'redux-observable'
import { of, empty, defer, from } from 'rxjs'
import * as r from '../redux'
import tempy from 'tempy'
import * as anki from '@silvestre/mkanki'
import sql from 'better-sqlite3'
import { getApkgExportData } from '../utils/prepareExport'
import { showSaveDialog } from '../utils/electron'
import { areSameFile } from '../utils/files'
import * as A from '../types/ActionType'
import { processClip, AnkiNote } from '../utils/ankiNote'

const exportApkgFailure: AppEpic = action$ =>
  action$.pipe(
    ofType<Action, ExportApkgFailure>(A.EXPORT_APKG_FAILURE),
    tap(() => (document.body.style.cursor = 'default')),
    flatMap(({ errorMessage }) =>
      errorMessage
        ? of(
            r.simpleMessageSnackbar(
              `There was a problem making clips: ${errorMessage}`
            )
          )
        : empty()
    )
  )
const exportApkgSuccess: AppEpic = action$ =>
  action$.pipe(
    ofType<Action, ExportApkgSuccess>(A.EXPORT_APKG_SUCCESS),
    tap(() => (document.body.style.cursor = 'default')),
    map(({ successMessage }) => r.simpleMessageSnackbar(successMessage))
  )

const exportApkg: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, ExportApkgRequest>(A.EXPORT_APKG_REQUEST),
    switchMap(exportApkgRequest => {
      const { mediaFileIdsToClipIds } = exportApkgRequest
      const directory = tempy.directory()

      const currentProject = r.getCurrentProject(state$.value)
      if (!currentProject)
        return of(r.exportApkgFailure('Could not find project'))

      const exportData = getApkgExportData(
        state$.value,
        currentProject,
        mediaFileIdsToClipIds
      )

      if ('missingMediaFiles' in exportData) {
        return getMissingMedia(
          exportData.missingMediaFiles,
          action$,
          exportApkgRequest
        )
      }

      return makeApkg(exportData, directory)
    })
  )

function makeApkg(exportData: ApkgExportData, directory: string) {
  return from(showSaveDialog('Anki APKG file', ['apkg'])).pipe(
    filter((path): path is string => Boolean(path)),
    flatMap(outputFilePath => {
      document.body.style.cursor = 'progress'
      const pkg = new anki.Package()
      const deck = new anki.Deck(exportData.projectId, exportData.deckName)
      const noteModel = new anki.Model(exportData.noteModel)
      const clozeNoteModel = new anki.ClozeModel(exportData.clozeNoteModel)

      const processClipsObservables = exportData.clips.map(
        (clipSpecs: ClipSpecs, i) =>
          defer(async () => {
            const clipDataResult = await processClip(clipSpecs, directory)
            if (clipDataResult.errors)
              throw new Error(clipDataResult.errors.join('; '))

            const clipData = clipDataResult.value
            await registerClip(pkg, deck, noteModel, clozeNoteModel, clipData)
            return r.setProgress({
              percentage: (i + 1 / exportData.clips.length) * 100,
              message: `${i + 1} clips out of ${
                exportData.clips.length
              } processed`,
            })
          })
      )
      return of(
        r.setProgress({
          percentage: 0,
          message: 'Processing clips...',
        })
      ).pipe(
        concat(from(processClipsObservables).pipe(mergeAll(20))),
        concat(
          of(
            r.setProgress({
              percentage: 100,
              message: 'Almost done! Saving .apkg file...',
            })
          ).pipe(
            concatMap(() => {
              pkg.addDeck(deck)
              const tmpFilename = tempy.file()
              return defer(() =>
                pkg.writeToFile(outputFilePath, {
                  db: sql(tmpFilename),
                  tmpFilename,
                })
              ).pipe(
                map(() =>
                  r.exportApkgSuccess('Flashcards made in ' + outputFilePath)
                ),
                endWith(r.setProgress(null))
              )
            })
          )
        )
      )
    }),
    catchError(err => {
      console.error(err)
      return from([
        r.exportApkgFailure(err.message || err.toString()),
        r.setProgress(null),
      ])
    })
  )
}

async function registerClip(
  pkg: any,
  deck: any,
  noteModel: any,
  clozeNoteModel: any,
  clipData: AnkiNote
) {
  const { note, clozeNote, soundData, imageData } = clipData
  deck.addNote(noteModel.note(note.fields, note.guid, note.tags)) // todo: try with knowclip id as second argument
  if (clozeNote)
    deck.addNote(
      clozeNoteModel.note(clozeNote.fields, clozeNote.guid, clozeNote.tags)
    )
  pkg.addMedia(await soundData.data(), soundData.fileName)
  if (imageData) pkg.addMedia(await imageData.data(), imageData.fileName)
}

function getMissingMedia(
  missingMediaFiles: Array<MediaFile>,
  action$: ActionsObservable<Action>,
  exportApkgRequest: ExportApkgRequest
) {
  const missingMediaFileIds = missingMediaFiles.map(file => file.id)
  const openMissingMediaFailure = action$.pipe(
    ofType<Action, OpenFileFailure>('OPEN_FILE_FAILURE'),
    filter(
      a =>
        a.file.type === 'MediaFile' && missingMediaFileIds.includes(a.file.id)
    ),
    take(1)
  )
  return from(missingMediaFiles).pipe(
    concatMap(file =>
      of(r.openFileRequest(file)).pipe(
        concat(
          action$.pipe(
            ofType<Action, OpenFileSuccess>('OPEN_FILE_SUCCESS'),
            filter(a => areSameFile(file, a.validatedFile)),
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
