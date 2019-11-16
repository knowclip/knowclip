import { flatMap, tap, map } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { of, empty } from 'rxjs'
import * as r from '../redux'
import { join } from 'path'
import fs from 'fs'
import Exporter from 'anki-apkg-export-multi-field/dist/exporter'
import createTemplate from 'anki-apkg-export-multi-field/dist/template'
import tempy from 'tempy'
import { showSaveDialog } from '../utils/electron'
import { getApkgExportData } from '../utils/prepareExport'
import clipAudio from '../utils/clipAudio'
import { promisify } from 'util'
import { AppEpic } from '../types/AppEpic'

const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const deleteFile = promisify(fs.unlink)

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
    flatMap(async ({ clipIds }) => {
      const directory = tempy.directory()

      document.body.style.cursor = 'progress'
      await wait(10)

      const outputFilePath = await showSaveDialog('Anki deck file', ['apkg'])

      if (!outputFilePath) return r.exportApkgFailure()

      try {
        const currentProject = r.getCurrentProject(state$.value)
        if (!currentProject)
          return r.exportApkgFailure('Could not find project')
        const noteType = r.getCurrentNoteType(state$.value)
        if (!noteType) return r.exportApkgFailure('Could not find note type')

        const exportData = getApkgExportData(
          state$.value,
          currentProject,
          clipIds
        )

        const apkg = new Exporter(exportData.deckName, {
          // @ts-ignore
          sql: window.SQL,
          template: createTemplate(exportData.template),
        })

        await Promise.all(
          exportData.clips.map(async clipSpecs => {
            const {
              outputFilename,
              sourceFilePath,
              startTime,
              endTime,
            } = clipSpecs
            const clipOutputFilePath = join(directory, outputFilename)
            await clipAudio(
              sourceFilePath,
              startTime,
              endTime,
              clipOutputFilePath
            )
            apkg.addMedia(outputFilename, await readFile(clipOutputFilePath))

            await deleteFile(clipOutputFilePath)
          })
        )

        exportData.clips.forEach(
          ({ flashcardSpecs: { fields, ...restSpecs } }) => {
            apkg.addCard(fields, restSpecs)
          }
        )

        await apkg
          .save({
            type: 'nodebuffer',
            base64: false,
            compression: 'DEFLATE',
          })
          .then(async (zip: Buffer) => {
            const promise = writeFile(outputFilePath, zip, 'binary')
            console.log(`Package has been generated: ${outputFilePath}`)
            return promise
          })

        return r.exportApkgSuccess('Flashcards made in ' + outputFilePath)
      } catch (err) {
        console.error(err)
        return r.exportApkgFailure(err)
      }
    })
  )

export default combineEpics(exportApkg, exportApkgSuccess, exportApkgFailure)
