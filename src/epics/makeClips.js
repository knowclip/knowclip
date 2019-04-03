import { flatMap, filter } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { from, of } from 'rxjs'
import * as r from '../redux'
import { join } from 'path'
import ffmpeg, { toTimestamp } from '../utils/ffmpeg'
import { readFileSync, writeFileSync } from 'fs'
import Exporter from 'anki-apkg-export-multi-field/dist/exporter'
import createTemplate from 'anki-apkg-export-multi-field/dist/template'
import tempy from 'tempy'
import { showSaveDialog } from '../utils/electron'
import { getApkgExportData } from '../utils/prepareExport'

const exportFailureSnackbar = err =>
  r.simpleMessageSnackbar(`There was a problem making clips: ${err.message}`)

const clip = (sourceFilePath, startTime, endTime, outputFilename) => {
  return new Promise((res, rej) => {
    ffmpeg(sourceFilePath)
      // .audioCodec('copy') // later, do this and change hardcoded '.mp3' for audio-only input
      .seekInput(toTimestamp(startTime))
      .inputOptions('-to ' + toTimestamp(endTime))
      .outputOptions('-vn')
      .output(outputFilename)
      .on(
        'end',
        //listener must be a function, so to return the callback wrapping it inside a function
        function() {
          res(outputFilename)
        }
      )
      .on('error', err => {
        console.error(err)
        rej(err)
      })
      .run()
  })
}

const exportApkg = (action$, state$) =>
  action$.pipe(
    ofType('MAKE_CLIPS'),
    filter(({ format }) => format === 'APKG'),
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
            await clip(sourceFilePath, startTime, endTime, clipOutputFilePath)
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

const exportCsvAndMp3 = (action$, state$) =>
  action$.pipe(
    ofType('MAKE_CLIPS'),
    filter(({ format }) => format === 'CSV+MP3'),
    flatMap(async ({ format }) => {
      const directory = r.getMediaFolderLocation(state$.value)

      if (!directory)
        return of(r.mediaFolderLocationFormDialog(r.makeClips(format), true))

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
        await Promise.all(
          exportData.clips.map(async clipSpecs => {
            const {
              outputFilename,
              sourceFilePath,
              startTime,
              endTime,
            } = clipSpecs
            const clipOutputFilePath = join(directory, outputFilename)
            await clip(sourceFilePath, startTime, endTime, clipOutputFilePath)
          })
        )

        return from([
          r.simpleMessageSnackbar('Clips made in ' + directory),
          r.exportFlashcards(exportData),
        ])
      } catch (err) {
        console.error(err)
        return of(exportFailureSnackbar(err))
      }
    }),
    flatMap(x => x)
  )

export default combineEpics(exportApkg, exportCsvAndMp3)
