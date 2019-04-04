import { flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { from, of } from 'rxjs'
import * as r from '../redux'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import Exporter from 'anki-apkg-export-multi-field/dist/exporter'
import createTemplate from 'anki-apkg-export-multi-field/dist/template'
import tempy from 'tempy'
import { showSaveDialog } from '../utils/electron'
import { getApkgExportData } from '../utils/prepareExport'
import clipAudio from '../utils/clipAudio'

const exportFailureSnackbar = err =>
  r.simpleMessageSnackbar(`There was a problem making clips: ${err.message}`)

const exportApkg = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_APKG'),
    flatMap(async ({ format }) => {
      const directory = tempy.directory()
      const outputFilePath = await showSaveDialog('Anki deck file', ['apkg'])

      if (!outputFilePath) return from([])

      try {
        const currentProjectMetadata = r.getCurrentProject(state$.value)
        if (!currentProjectMetadata)
          return of(r.simpleMessageSnackbar('Could not find project'))
        const noteType = r.getCurrentNoteType(state$.value)
        if (!noteType)
          return of(r.simpleMessageSnackbar('Could not find note type'))

        const exportData = getApkgExportData(
          state$.value,
          currentProjectMetadata,
          noteType
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
            apkg.addMedia(outputFilename, readFileSync(clipOutputFilePath)) // async this?
          })
        )

        exportData.clips.forEach(({ flashcardSpecs }) => {
          apkg.addCard(flashcardSpecs.fields, flashcardSpecs.tags)
        })

        await apkg
          .save({
            type: 'nodebuffer',
            base64: false,
            compression: 'DEFLATE',
          })
          .then(zip => {
            writeFileSync(outputFilePath, zip, 'binary')
            console.log(`Package has been generated: ${outputFilePath}`)
          })

        return of(
          r.simpleMessageSnackbar('Flashcards made in ' + outputFilePath)
        )
      } catch (err) {
        console.error(err)
        return of(exportFailureSnackbar(err))
      }
    }),
    flatMap(x => x)
  )

export default exportApkg
