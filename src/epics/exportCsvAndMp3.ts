import {
  mergeMap,
  mergeAll,
  concat,
  concatMap,
  map,
  endWith,
  catchError,
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { of, from, defer, EMPTY } from 'rxjs'
import r from '../redux'
import A from '../types/ActionType'
import { unparse } from 'papaparse'

const exportCsv: AppEpic = (
  action$,
  state$,
  { processNoteMedia, writeFile, getApkgExportData }
) =>
  action$.pipe(
    ofType(A.exportCsv as const),
    mergeMap(
      async ({
        mediaFileIdsToClipIds,
        csvFilePath,
        mediaFolderLocation,
        rememberLocation,
      }) => {
        const clozeCsvFilePath = csvFilePath.replace(/\.csv$/, '__CLOZE.csv')

        const currentProject = r.getCurrentProject(state$.value)
        if (!currentProject)
          return of(r.simpleMessageSnackbar('Could not find project'))

        const exportRequest = await getApkgExportData(
          state$.value,
          currentProject,
          mediaFileIdsToClipIds
        )
        if (exportRequest.errors) {
          return of(r.exportApkgFailure(exportRequest.errors.join('; ')))
        }

        const exportResult = exportRequest.value
        if (exportResult.type === 'MISSING MEDIA FILES') {
          return from(
            [...exportResult.missingMediaFiles].map((file) =>
              r.locateFileRequest(
                file,
                `You can't make clips from this file until you've located it in the filesystem:\n${file.name}`
              )
            )
          )
        }

        const { csvText, clozeCsvText } = getCsvText(exportResult.apkgData)

        let processed = 0

        const processClipsObservables = exportResult.apkgData.clips.map(
          (clipSpecs: ClipSpecs) =>
            defer(async () => {
              const clipDataResult = await processNoteMedia(
                clipSpecs,
                mediaFolderLocation,
                mediaFolderLocation
              )
              if (clipDataResult.errors)
                throw new Error(clipDataResult.errors.join('; '))

              const number = ++processed
              return r.setProgress({
                percentage: (number / exportResult.apkgData.clips.length) * 100,
                message: `${number} clips out of ${exportResult.apkgData.clips.length} processed`,
              })
            })
        )

        return of(
          r.setProgress({
            percentage: 0,
            message: 'Processing clips...',
          })
        ).pipe(
          concat(
            rememberLocation &&
              mediaFolderLocation !== r.getMediaFolderLocation(state$.value)
              ? of(r.setMediaFolderLocation(mediaFolderLocation))
              : EMPTY
          ),
          concat(from(processClipsObservables).pipe(mergeAll(20))),
          concat(
            of(
              r.setProgress({
                percentage: 100,
                message: `Almost done! Saving csv ${
                  clozeCsvText ? 'files' : 'file'
                }...`,
              })
            ).pipe(
              concatMap(() => {
                return defer(async () => {
                  await writeFile(csvFilePath, csvText)
                  if (clozeCsvText) {
                    await writeFile(clozeCsvFilePath, clozeCsvText)
                  }
                }).pipe(
                  map(() =>
                    r.exportApkgSuccess(
                      'Flashcards made in ' +
                        [csvFilePath, clozeCsvText && clozeCsvFilePath]
                          .filter((s) => s)
                          .join(' and ')
                    )
                  ),
                  endWith(r.setProgress(null))
                )
              })
            )
          )
        )
      }
    ),
    mergeMap((x) => x),

    catchError((err) => {
      console.error(err)
      return from([
        r.exportApkgFailure(err.message || err.toString()),
        r.setProgress(null),
      ])
    })
  )

export default combineEpics(exportCsv)

const getCsvText = (exportData: ApkgExportData) => {
  const csvData: string[][] = []
  const clozeCsvData: string[][] = []
  for (const {
    flashcardSpecs: { fields, tags, clozeDeletions },
  } of exportData.clips) {
    csvData.push([...fields, tags])
    if (clozeDeletions) {
      clozeCsvData.push([clozeDeletions, ...fields.slice(1), tags])
    }
  }

  return {
    csvText: unparse(csvData),
    clozeCsvText: clozeCsvData.length ? unparse(clozeCsvData) : null,
  }
}
