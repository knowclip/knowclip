import { map } from 'rxjs/operators'
import * as r from '../redux'
import { from, of } from 'rxjs'
import { newExternalSubtitlesTrack } from '../utils/subtitles'
import { LoadSuccessHandler, LoadFailureHandler } from './types'
import { extname } from 'path'

const isVtt = (filePath: FilePath) => extname(filePath) === '.vtt'

export const loadSuccess: LoadSuccessHandler<ExternalSubtitlesFileRecord> = (
  fileRecord,
  filePath,
  state,
  effects
) => {
  if (isVtt(filePath)) {
    return from(effects.getSubtitlesFromFile(filePath, state)).pipe(
      map(({ chunks, vttFilePath }) =>
        r.addSubtitlesTrack(
          newExternalSubtitlesTrack(
            fileRecord.id,
            fileRecord.parentId,
            chunks,
            vttFilePath,
            filePath
          )
        )
      )
    )
  } else {
    const temporaryVttFileRecord = r.getFileRecord(
      state,
      'TemporaryVttFile',
      fileRecord.id
    )

    return from(effects.getSubtitlesFromFile(filePath, state)).pipe(
      map(({ chunks, vttFilePath }) =>
        r.addFile(
          {
            type: 'TemporaryVttFile',
            id: fileRecord.id,
            parentId: fileRecord.id, // not needed?
            parentType: 'ExternalSubtitlesFile',
          },
          vttFilePath
        )
      )
    )
  }
}

export const loadFailure: LoadFailureHandler<ExternalSubtitlesFileRecord> = (
  fileRecord,
  filePath,
  errorMessage,
  state,
  effects
) => of(r.fileSelectionDialog(errorMessage))

// const locateSubtitlesFileRequest: AppEpic = (action$, state$) =>
//   action$.pipe(
//     // filter<Action, AddFileRequest<ExternalSubtitlesFileRecord>>(
//     //   isAddFile<ExternalSubtitlesFileRecord>('ExternalSubtitlesFile')
//     // ),
//     filter(isLocateFileRequest('ExternalSubtitlesFile')),
//     flatMap<
//       LocateFileRequest & { fileRecord: ExternalSubtitlesFileRecord },
//       Promise<Observable<Action>>
//     >(async ({ filePath, fileRecord }) => {
//       try {
//         const { chunks, vttFilePath } = await getSubtitlesFromFile(
//           filePath,
//           state$.value
//         )

//         const actions: Action[] = [
//           // r.loadExternalSubtitlesSuccess(fileRecord),
//           // r.locateFileSuccess(fileRecord, filePat)
//           //
//           // r.addFile<ExternalSubtitlesFileRecord>(
//           //   {
//           //     type: 'ExternalSubtitlesFile',
//           //     id: uuid(),
//           //     parentId: fileRecord.parentId,
//           //   },
//           //   fileaAth // vttFilePath
//           // ),
//           // r.loadFileRequest,
//         ]

//         return await from(actions)
//       } catch (err) {
//         console.error(err.message)
//         return await of(
//           //
//           r.simpleMessageSnackbar(
//             `Could not load subtitles:${err.message || err.toString()}`
//           )
//         )
//       }
//     }),
//     flatMap(x => x)
//   )
