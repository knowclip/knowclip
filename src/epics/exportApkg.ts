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
  concatMap,
  filter,
  takeUntil,
  take,
  ignoreElements,
  switchMap,
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
import { showSaveDialog } from '../utils/electron'

const { writeFile, readFile, unlink: deleteFile } = promises

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
        const missingMediaFileIds = [...exportData].map(file => file.id)
        return from(exportData).pipe(
          concatMap(file =>
            of(r.openFileRequest(file)).pipe(
              concat(
                action$.pipe(
                  filter(
                    a =>
                      a.type === 'OPEN_FILE_SUCCESS' &&
                      a.validatedFile.id === file.id
                  ),
                  take(1),
                  ignoreElements()
                )
              )
            )
          ),
          startWith(r.closeDialog()),
          takeUntil(
            action$.pipe(
              filter(
                a =>
                  a.type === 'OPEN_FILE_FAILURE' &&
                  missingMediaFileIds.includes(a.file.id)
              ),
              take(1)
            )
          ),
          endWith(r.reviewAndExportDialog(exportApkgRequest.mediaOpenPrior))
        )
      }

      return from(showSaveDialog('Anki APKG file', ['apkg'])).pipe(
        filter((path): path is string => Boolean(path)),
        flatMap(outputFilePath => {
          document.body.style.cursor = 'progress'

          const apkg = new Exporter(exportData.deckName, {
            // @ts-ignore
            sql: window.SQL,
            template: createTemplate(exportData.template),
          })

          let count = 0

          const processClipsObservables = exportData.clips.map(clipSpecs =>
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
                      console.log(
                        `Package has been generated: ${outputFilePath}`
                      )

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
    })
  )

export default combineEpics(exportApkg, exportApkgSuccess, exportApkgFailure)
