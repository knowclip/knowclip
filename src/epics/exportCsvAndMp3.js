import { flatMap } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { of, from } from 'rxjs'
import { promisify } from 'util'
import fs from 'fs'
import { join } from 'path'
import * as r from '../redux'
import { getCsvText } from '../utils/prepareExport'
import { getApkgExportData } from '../utils/prepareExport'
// import { showSaveDialog } from '../utils/electron'
import clipAudio from '../utils/clipAudio'

const writeFile = promisify(fs.writeFile)

const exportFailureSnackbar = err =>
  r.simpleMessageSnackbar(`There was a problem making clips: ${err.message}`)

const exportCsv = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_CSV'),
    flatMap(async ({ clipIds, csvFilePath }) => {
      try {
        // const filename = await showSaveDialog('Comma-separated values', ['csv'])
        // if (!filename) return { type: 'NOOP_EXPORT_CSV' }
        const currentProjectMetadata = r.getCurrentProject(state$.value)
        if (!currentProjectMetadata)
          return of(r.simpleMessageSnackbar('Could not find project'))

        const exportData = getApkgExportData(
          state$.value,
          currentProjectMetadata,
          clipIds
        )
        const csvText = getCsvText(exportData)
        await writeFile(csvFilePath, csvText, 'utf8')
        return from([
          r.simpleMessageSnackbar(`Flashcards saved in ${csvFilePath}`),
          r.exportMp3(exportData),
        ])
      } catch (err) {
        return of(
          r.simpleMessageSnackbar(`Problem saving flashcard: ${err.message}`)
        )
      }
    }),
    flatMap(x => x)
  )

const exportMp3 = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_MP3'),
    flatMap(async ({ format, exportData }) => {
      const directory = r.getMediaFolderLocation(state$.value)

      if (!directory)
        return of(
          r.mediaFolderLocationFormDialog(r.exportMp3(exportData), true)
        )

      try {
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
          })
        )

        return from([r.simpleMessageSnackbar('Clips made in ' + directory)])
      } catch (err) {
        console.error(err)
        return of(exportFailureSnackbar(err))
      }
    }),
    flatMap(x => x)
  )

export default combineEpics(exportCsv, exportMp3)
