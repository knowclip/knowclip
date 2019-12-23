import { flatMap, mergeAll } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { of, from, Observable } from 'rxjs'
import { promisify } from 'util'
import fs from 'fs'
import { join } from 'path'
import * as r from '../redux'
import { getCsvText } from '../utils/prepareExport'
import { getApkgExportData } from '../utils/prepareExport'
import clipAudio from '../utils/clipAudio'
import { AppEpic } from '../types/AppEpic'

const writeFile = promisify(fs.writeFile)

const exportFailureSnackbar = (err: Error) =>
  r.simpleMessageSnackbar(`There was a problem making clips: ${err.message}`)

const exportCsv: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, ExportCsv>(A.EXPORT_CSV),
    flatMap<ExportCsv, Promise<Observable<Action>>>(
      async ({ clipIds, csvFilePath, mediaFolderLocation }) => {
        try {
          const currentProject = r.getCurrentProject(state$.value)
          if (!currentProject)
            return of(r.simpleMessageSnackbar('Could not find project'))

          const exportData = getApkgExportData(
            state$.value,
            currentProject,
            clipIds
          )
          const csvText = getCsvText(exportData)
          await writeFile(csvFilePath, csvText, 'utf8')
          return from([
            r.simpleMessageSnackbar(`Flashcards saved in ${csvFilePath}`),
            r.setMediaFolderLocation(mediaFolderLocation), // should probably just get rid of this action
            r.exportMp3(exportData),
          ])
        } catch (err) {
          return of(
            r.simpleMessageSnackbar(`Problem saving flashcard: ${err.message}`)
          )
        }
      }
    ),
    flatMap<Observable<Action>, Observable<Action>>(x => x)
  )

const exportMp3: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, ExportMp3>(A.EXPORT_MP3),
    flatMap<ExportMp3, Promise<Observable<Action>>>(async ({ exportData }) => {
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
    mergeAll()
  )

export default combineEpics(exportCsv, exportMp3)
