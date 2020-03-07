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
import { join, basename } from 'path'
import { promises } from 'fs'
import tempy from 'tempy'
import * as anki from '@silvestre/mkanki'
import sql from 'better-sqlite3'
import {
  getApkgExportData,
  TEMPLATE_CSS,
  CLOZE_QUESTION_FORMAT,
  CLOZE_ANSWER_FORMAT,
} from '../utils/prepareExport'
import clipAudio from '../utils/clipAudio'
import { showSaveDialog } from '../utils/electron'
import { areSameFile } from '../utils/files'
import { getVideoStill, getMidpoint } from '../utils/getVideoStill'

const { readFile } = promises

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
      const { clipIds } = exportApkgRequest
      const directory = tempy.directory()

      const currentProject = r.getCurrentProject(state$.value)
      if (!currentProject)
        return of(r.exportApkgFailure('Could not find project'))

      const exportData = getApkgExportData(
        state$.value,
        currentProject,
        clipIds
      )

      if (exportData instanceof Set) {
        return getMissingMedia(exportData, action$, exportApkgRequest)
      }

      return makeApkg(exportData, directory)
    })
  )
function makeApkg(exportData: ApkgExportData, directory: string) {
  return from(showSaveDialog('Anki APKG file', ['apkg'])).pipe(
    filter((path): path is string => Boolean(path)),
    flatMap(outputFilePath => {
      document.body.style.cursor = 'progress'
      const fields = exportData.template.fields.map(fn => ({ name: fn }))
      const noteModel = new anki.Model({
        name: `Audio note (${exportData.deckName})`,
        id: exportData.projectId,
        flds: fields,
        req: exportData.template.cards.map((t, i) => [
          i,
          'all',
          [exportData.template.fields.indexOf('sound')],
        ]),
        css: TEMPLATE_CSS,
        tmpls: exportData.template.cards.map(template => ({
          name: template.name,
          qfmt: template.questionFormat,
          afmt: template.answerFormat,
        })),
      })
      const clozeNoteModel = new anki.ClozeModel({
        id: exportData.projectId,
        name: `Cloze (${exportData.deckName})`,
        flds: fields,
        css: TEMPLATE_CSS,
        tmpl: {
          name: 'Cloze',
          qfmt: CLOZE_QUESTION_FORMAT,
          afmt: CLOZE_ANSWER_FORMAT,
        },
      })

      const deck = new anki.Deck(Date.now(), exportData.deckName)

      const pkg = new anki.Package()

      let count = 0
      const processClipsObservables = exportData.clips.map(
        (clipSpecs: ClipSpecs) =>
          defer(async () => {
            const {
              outputFilename,
              sourceFilePath,
              startTime,
              endTime,
              flashcardSpecs,
            } = clipSpecs
            const { fields } = flashcardSpecs
            deck.addNote(noteModel.note(fields, null, flashcardSpecs.tags))
            if (flashcardSpecs.clozeDeletions)
              deck.addNote(
                clozeNoteModel.note(
                  [flashcardSpecs.clozeDeletions, ...fields.slice(1)],
                  null,
                  flashcardSpecs.tags
                )
              )
            const clipOutputFilePath = join(directory, outputFilename)
            try {
              await clipAudio(
                sourceFilePath,
                startTime,
                endTime,
                clipOutputFilePath
              )
              await pkg.addMedia(
                await readFile(clipOutputFilePath),
                outputFilename
              )
            } catch (err) {
              console.error(err)
              console.log({
                sourceFilePath,
                startTime,
                endTime,
                clipOutputFilePath,
              })
              throw new Error(`Could not make cliip from ${sourceFilePath}`)
            }
            if (clipSpecs.flashcardSpecs.image) {
              const clipId = clipSpecs.flashcardSpecs.id
              const { image } = clipSpecs.flashcardSpecs
              const imagePath = await getVideoStill(
                clipId,
                sourceFilePath,
                typeof image.seconds === 'number'
                  ? image.seconds
                  : +(getMidpoint(startTime, endTime) / 1000).toFixed(3)
              )
              if (imagePath instanceof Error) throw imagePath

              await pkg.addMedia(await readFile(imagePath), basename(imagePath))
            }
            count += 1

            return r.setProgress({
              percentage: (count / exportData.clips.length) * 100,
              message: `${count} clips out of ${
                exportData.clips.length
              } processed`,
            })
          })
      )
      const result = of(
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
              return defer(() =>
                pkg.writeToFile(outputFilePath, sql(tempy.file()))
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
      return result
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

function getMissingMedia(
  exportData: Set<MediaFile>,
  action$: ActionsObservable<Action>,
  exportApkgRequest: ExportApkgRequest
) {
  const missingMediaFileIds = [...exportData].map(file => file.id)
  const openMissingMediaFailure = action$.pipe(
    ofType<Action, OpenFileFailure>('OPEN_FILE_FAILURE'),
    filter(
      a =>
        a.file.type === 'MediaFile' && missingMediaFileIds.includes(a.file.id)
    ),
    take(1)
  )
  return from(exportData).pipe(
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
        exportApkgRequest.clipIds
      )
    )
  )
}

export default combineEpics(exportApkg, exportApkgSuccess, exportApkgFailure)
