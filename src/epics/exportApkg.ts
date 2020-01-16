import {
  flatMap,
  tap,
  map,
  catchError,
  mergeAll,
  last,
  startWith,
  endWith,
  concat,
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { of, empty, defer, from } from 'rxjs'
import * as r from '../redux'
import { join } from 'path'
import { promises } from 'fs'
import Exporter from 'anki-apkg-export-multi-field/dist/exporter'
import createTemplate from 'anki-apkg-export-multi-field/dist/template'
import tempy from 'tempy'
import { getApkgExportData } from '../utils/prepareExport'
import clipAudio from '../utils/clipAudio'
import { AppEpic } from '../types/AppEpic'

const { writeFile, readFile, unlink: deleteFile } = promises

const exportApkgFailure: AppEpic = (action$, state$) =>
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
const exportApkgSuccess: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, ExportApkgSuccess>(A.EXPORT_APKG_SUCCESS),
    tap(() => (document.body.style.cursor = 'default')),
    map(({ successMessage }) => r.simpleMessageSnackbar(successMessage))
  )

const exportApkg: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, ExportApkgRequest>(A.EXPORT_APKG_REQUEST),
    flatMap(exportApkgRequest => {
      const { clipIds, outputFilePath } = exportApkgRequest
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
        return from([
          r.closeDialog(),
          ...[...exportData].map(file =>
            r.fileSelectionDialog(
              `You can't make clips from this file until you've located it in the filesystem. Please find "${
                file.name
              }" and try again.`,
              file
            )
          ),
          r.reviewAndExportDialog(),
        ])
      }

      document.body.style.cursor = 'progress'

      const apkg = new Exporter(exportData.deckName, {
        // @ts-ignore
        sql: window.SQL,
        template: createTemplate(exportData.template),
      })

      let count = 0

      const processClipsObservables = exportData.clips.map(
        (clipSpecs, clipIndex) =>
          defer(async () => {
            const {
              outputFilename,
              sourceFilePath,
              startTime,
              endTime,
              flashcardSpecs,
            } = clipSpecs

            const { fields, ...restSpecs } = flashcardSpecs
            apkg.addCard(fields, restSpecs)

            const clipOutputFilePath = join(directory, outputFilename)
            await clipAudio(
              sourceFilePath,
              startTime,
              endTime,
              clipOutputFilePath
            )

            apkg.addMedia(outputFilename, await readFile(clipOutputFilePath))

            await deleteFile(clipOutputFilePath)

            count += 1
            return r.setProgress({
              percentage: (count / exportData.clips.length) * 100,
              message: `${count} clips out of ${
                exportData.clips.length
              } processed`,
            })
          })
      )
      const mergedProcessClips = from(processClipsObservables).pipe(
        mergeAll(20)
      )
      const result = mergedProcessClips.pipe(
        startWith(
          r.setProgress({
            percentage: 0,
            message: 'Processing clips...',
          })
        ),
        endWith(
          r.setProgress({
            percentage: 100,
            message: 'Saving .apkg file...',
          })
        ),
        concat(
          mergedProcessClips.pipe(
            last(),
            flatMap(() =>
              from(
                apkg.save({
                  type: 'nodebuffer',
                  base64: false,
                  compression: 'DEFLATE',
                })
              ).pipe(
                flatMap(async (zip: Buffer) => {
                  await writeFile(outputFilePath, zip, 'binary')
                  console.log(`Package has been generated: ${outputFilePath}`)

                  return r.exportApkgSuccess(
                    'Flashcards made in ' + outputFilePath
                  )
                }),
                endWith(r.setProgress(null))
              )
            ),
            catchError(err => {
              console.error(err)

              return from([
                r.exportApkgFailure(err.message || err.toString()),
                r.setProgress(null),
              ])
            })
          )
        )
      )
      return result
    })
  )

export default combineEpics(exportApkg, exportApkgSuccess, exportApkgFailure)
