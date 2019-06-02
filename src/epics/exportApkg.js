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

const wait = ms => new Promise(res => setTimeout(res, ms))

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const exportApkgFailure = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_APKG_FAILURE'),
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
const exportApkgSuccess = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_APKG_SUCCESS'),
    tap(() => (document.body.style.cursor = 'default')),
    map(({ successMessage }) => r.simpleMessageSnackbar(successMessage))
  )

const exportApkg = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_APKG_REQUEST'),
    flatMap(async ({ clipIds }) => {
      const directory = tempy.directory()

      document.body.style.cursor = 'progress'
      await wait(10)

      const outputFilePath = await showSaveDialog('Anki deck file', ['apkg'])

      if (!outputFilePath) return r.exportApkgFailure()

      try {
        const currentProjectMetadata = r.getCurrentProject(state$.value)
        if (!currentProjectMetadata)
          return r.exportApkgFailure('Could not find project')
        const noteType = r.getCurrentNoteType(state$.value)
        if (!noteType) return r.exportApkgFailure('Could not find note type')

        const exportData = getApkgExportData(
          state$.value,
          currentProjectMetadata,
          clipIds
        )

        const apkg = new Exporter(exportData.deckName, {
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
            apkg.addMedia(outputFilename, await readFile(clipOutputFilePath)) // async this?
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
          .then(async zip => {
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
