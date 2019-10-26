import { filter, flatMap, map } from 'rxjs/operators'
import { of, Observable } from 'rxjs'
import * as r from '../redux'
import { from } from 'rxjs'
import { AppEpic } from '../types/AppEpic'
import {
  getSubtitlesFromFile,
  newExternalSubtitlesTrack,
  newEmbeddedSubtitlesTrack,
} from './subtitles'
import { existsSync } from 'fs'
import {
  isCreateFileRecord,
  isLoadFileRequest,
  isLoadFileFailure,
  isLoadFileSuccess,
  isLocateFileRequest,
} from '../utils/files'
import { combineEpics, ofType } from 'redux-observable'
import { extname, basename } from 'path'

const createFileRecord: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, CreateFileRecord>(A.CREATE_FILE_RECORD),
    map<CreateFileRecord, Action>(({ fileRecord }) =>
      r.loadFileRequest(fileRecord)
    )
  )

const isVtt = (filePath: FilePath) => extname(filePath) === '.vtt'

const loadFileRequest: AppEpic = (action$, state$) =>
  action$.pipe(
    // filter<Action, LoadFileRequest>(isLoadSubtitlesRequest),
    filter(
      isLoadFileRequest<ExternalSubtitlesFileRecord>('ExternalSubtitlesFile')
    ),
    // if filepath provided, try to locate file
    //   if filepath valid, loadFileSuccess
    //   if filepath invalid, do file-generating or file-finding action for particular file type
    // if no filepath provided, do file-generating or file-finding action for particular file type
    flatMap<LoadFileRequestWith<ExternalSubtitlesFileRecord>, Promise<Action>>(
      async a => {
        const { fileRecord } = a
        const file = r.getPreviouslyLoadedFile(state$.value, fileRecord)
        if (!file || !file.filePath)
          // correct second part of condition?
          return await r.loadFileFailure(
            fileRecord,
            null,
            'You must first locate this file.'
          )
        if (!existsSync(file.filePath))
          return await r.loadFileFailure(
            fileRecord,
            file.filePath,
            `This file appears to have moved or been renamed.`
          )
        try {
          return await r.loadFileSuccess(fileRecord, file.filePath)
        } catch (err) {
          return await r.loadFileFailure(
            fileRecord,
            file ? file.filePath : null,
            err.message || err.toString()
          )
        }
      }
    )
  )

const loadSubtitlesFileFailure: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(isLoadFileFailure('ExternalSubtitlesFile')),
    map<LoadFileFailureWith<ExternalSubtitlesFileRecord>, Action>(
      ({ fileRecord, filePath, errorMessage }) => {
        return r.fileSelectionDialog(errorMessage)
        const file = r.getPreviouslyLoadedFile(state$.value, fileRecord)
        if (filePath) {
          // something went wrong with file at path
          //   if it was found but something went wrong anyway, show error dialog
          //   if it wasnt found, show locate dialog
        } else {
          // there was no remembered path, so show locate dialog
        }
      }
    )
  )

const loadFileSuccess: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, LoadFileSuccess>(A.LOAD_FILE_SUCCESS),
    flatMap<LoadFileSuccess, Promise<Action>>(
      async ({ fileRecord, filePath }) => {
        switch (fileRecord.type) {
          case 'ExternalSubtitlesFile': {
            if (isVtt(filePath)) {
              const { chunks, vttFilePath } = await getSubtitlesFromFile(
                filePath,
                state$.value
              )

              return await r.addSubtitlesTrack(
                newExternalSubtitlesTrack(
                  fileRecord.id,
                  fileRecord.parentId,
                  chunks,
                  vttFilePath,
                  filePath
                )
              )
            } else {
              const TemporaryVttFileRecord = r.getFileRecord(
                state$.value,
                'TemporaryVttFile',
                fileRecord.id
              )

              return TemporaryVttFileRecord
                ? await r.loadFileRequest(TemporaryVttFileRecord)
                : await r.createFileRecord(
                    {
                      type: 'TemporaryVttFile',
                      id: fileRecord.id,
                      parentId: fileRecord.id, // not needed?
                      parentType: 'ExternalSubtitlesTrack',
                    },
                    null
                  )
            }
          }
          case 'TemporaryVttFile': {
            const { chunks, vttFilePath } = await getSubtitlesFromFile(
              filePath,
              state$.value
            )
            // const parentFileRecord = r.getFileRecord(
            //   state$.value,
            //   fileRecord.parentType,
            //   fileRecord.id
            // ) //wronh\g
            // const parentFile = r.getPreviouslyLoadedFile(state$.value)

            return r.addSubtitlesTrack(
              fileRecord.parentType === 'ExternalSubtitlesTrack'
                ? newExternalSubtitlesTrack(
                    fileRecord.id,
                    fileRecord.parentId,
                    chunks,
                    vttFilePath,
                    filePath
                  )
                : newEmbeddedSubtitlesTrack(
                    fileRecord.id,
                    fileRecord.parentId,
                    chunks,
                    fileRecord.streamIndex,
                    vttFilePath
                  )
            )
          }
          default:
            return r.simpleMessageSnackbar(
              'Unimplemented file load success hook'
            )
        }

        // switch (loadedFileData.type) {
        //   case 'VttExternalSubtitlesFile':
        //     return r.addSubtitlesTrack(loadedFileData.subtitles)
        //   case 'NotVttExternalSubtitlesFile': {
        //     const TemporaryVttFileRecord = r.getFileRecord(
        //       state$.value,
        //       'TemporaryVttFile',
        //       fileRecord.id
        //     )

        //     return TemporaryVttFileRecord
        //       ? r.loadFileRequest(TemporaryVttFileRecord)
        //       : r.createFileRecord(
        //           {
        //             type: 'TemporaryVttFile',
        //             id: fileRecord.id,
        //             parentId: fileRecord.id, // not needed?
        //             parentType: 'ExternalSubtitlesTrack',
        //           },
        //           null
        //         )
        //   }
        //   default:
        //     return r.simpleMessageSnackbar('boop')
        //   // case 'VttConvertedSubtitlesFile':
        //   //   return r.addSubtitlesTrack({
        //   //     type:
        //   //   })
        // }
      }
    )
  )

// or should be loadSubtitlesFromFileRequest?
const locateSubtitlesFileRequest: AppEpic = (action$, state$) =>
  action$.pipe(
    // filter<Action, CreateFileRecordRequest<ExternalSubtitlesFileRecord>>(
    //   isCreateFileRecord<ExternalSubtitlesFileRecord>('ExternalSubtitlesFile')
    // ),
    filter(isLocateFileRequest('ExternalSubtitlesFile')),
    flatMap<
      LocateFileRequest & { fileRecord: ExternalSubtitlesFileRecord },
      Promise<Observable<Action>>
    >(async a => {
      const { filePath, fileRecord } = a
      try {
        const { chunks, vttFilePath } = await getSubtitlesFromFile(
          filePath,
          state$.value
        )

        const actions: Action[] = [
          // r.loadExternalSubtitlesSuccess(fileRecord),
          // r.locateFileSuccess(fileRecord, filePat)
          //
          // r.createFileRecord<ExternalSubtitlesFileRecord>(
          //   {
          //     type: 'ExternalSubtitlesFile',
          //     id: uuid(),
          //     parentId: fileRecord.parentId,
          //   },
          //   fileaAth // vttFilePath
          // ),
          // r.loadFileRequest,
        ]

        return await from(actions)
      } catch (err) {
        console.error(err.message)
        return await of(
          //
          r.simpleMessageSnackbar(
            `Could not load subtitles:${err.message || err.toString()}`
          )
        )
      }
    }),
    flatMap(x => x)
  )
// export const locateSubtitlesFile: AppEpic = (action$, state$) =>
//   action$.pipe(
//     filter<Action, LocateFileRequest>(
//       isLocateFileRequest<ExternalSubtitlesFileRecord>('ExternalSubtitlesFile')
//     ),
//     flatMap<LocateFileRequest, Promise<Action>>(async ({ fileRecord }) => {
//       return fileRecord.id
//     })
//   )

const loadConvertedVttSubtitlesFileRequest: AppEpic = (action$, state$) =>
  action$.pipe(
    filter<Action, LoadFileRequestWith<TemporaryVttFileRecord>>(
      isLoadFileRequest('TemporaryVttFile')
    ),
    flatMap<LoadFileRequestWith<TemporaryVttFileRecord>, Promise<Action>>(
      async ({ fileRecord }) => {
        const file = r.getPreviouslyLoadedFile(state$.value, fileRecord)

        if (!file || !file.filePath) {
          const parentFileRecord = r.getFileRecord(
            state$.value,
            'ExternalSubtitlesFile',
            fileRecord.parentId
          )
          const parentFile = parentFileRecord
            ? r.getPreviouslyLoadedFile(state$.value, parentFileRecord)
            : null

          if (
            !(parentFileRecord && parentFile) ||
            parentFile.status !== 'CURRENTLY_LOADED'
          )
            return await r.loadFileFailure(
              fileRecord,
              null,
              'You must first locate this file.'
            )

          const { chunks, vttFilePath } = await getSubtitlesFromFile(
            parentFile.filePath,
            state$.value
          )

          return r.loadFileSuccess(fileRecord, vttFilePath)
        }

        if (!file.filePath || !existsSync(file.filePath))
          return await r.loadFileFailure(
            fileRecord,
            file.filePath,
            `This file appears to have moved or been renamed.`
          )

        return await r.loadFileSuccess(fileRecord, file.filePath)
      }
    )
  )
const loadConvertedVttSubtitlesFileFailure: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(isLoadFileFailure('TemporaryVttFile')),
    map<LoadFileFailureWith<TemporaryVttFileRecord>, Action>(
      ({ fileRecord, errorMessage }) => {
        const parentFileRecord = r.getFileRecord(
          state$.value,
          'ExternalSubtitlesFile',
          fileRecord.parentId
        ) as ExternalSubtitlesFileRecord
        const loadedParentFile = r.getPreviouslyLoadedFile(
          state$.value,
          parentFileRecord
        )
        if (!loadedParentFile || !loadedParentFile.filePath)
          return r.simpleMessageSnackbar(
            'Problem loading subtitles. ' + errorMessage
          )
        return r.simpleMessageSnackbar(
          `There was a problem loading subtitles file "${basename(
            loadedParentFile.filePath
          )}: ${errorMessage}"`
        )
      }
    )
    // flatMap<LoadFileFailureWith<TemporaryVttFileRecord>, Promise<Action>>(

    // async ({ fileRecord, filePath, errorMessage }) => {

    // try {
    //   const parentFileRecord = r.getFileRecord(
    //     state$.value,
    //     'ExternalSubtitlesFile',
    //     fileRecord.parentId
    //   ) as ExternalSubtitlesFileRecord
    //   const loadedParentFile = r.getPreviouslyLoadedFile(
    //     state$.value,
    //     parentFileRecord
    //   )
    //   if (!loadedParentFile) throw new Error('BLoop boo bliiooobp')
    //   const { chunks, vttFilePath } = await getSubtitlesFromFile(
    //     loadedParentFile.filePath,
    //     state$.value
    //   )
    //   return
    // } catch (err) {}

    //     if (filePath) {
    //       // something went wrong with file at path
    //       //   if it was found but something went wrong anyway, show error dialog
    //       //   if it wasnt found, show locate dialog
    //     } else {
    //       // there was no remembered path, so show locate dialog
    //     }
    //   }
    // )
  )

// // export const handleLocate: Record<
// //   FileRecord['type'],
// //   (
// //     action: LocateFileRequest,
// //     state: AppState,
// //     epicsDependencies: EpicsDependencies
// //   ) => LocateFileSuccess | LocateFileFailure | null
// // > = {
// //   ExternalSubtitlesFile: () => null,
// //   ProjectFile: () => null,
// //   MediaFile: () => null,
// //   TemporaryVttFile: () => null,
// //   WaveformPng: () => null,
// //   ConstantBitrateMp3: () => null,
// //   VideoStillImage: () => null,
// // }
// export const handleLocate = (
//   action: LocateFileRequest,
//   state: AppState,
//   epicsDependencies: EpicsDependencies
// ): LocateFileSuccess | LocateFileSuccess | Action => {
//   switch (action.fileRecord.type) {
//     case 'ExternalSubtitlesFile': {
//       // return action.fileRecord
//     }
//     // case 'ProjectFile':
//     //   return
//     // case 'MediaFile':
//     //   return
//     // case 'TemporaryVttFile':
//     //   return
//     // case 'WaveformPng':
//     //   return
//     // case 'ConstantBitrateMp3':
//     //   return
//     // case 'VideoStillImage':
//     //   return
//     default:
//       return { type: 'NOOP' } as Action
//   }
// }

export default combineEpics(
  createFileRecord,
  loadFileRequest,
  loadSubtitlesFileFailure,
  loadFileSuccess,
  locateSubtitlesFileRequest,
  loadConvertedVttSubtitlesFileRequest,
  loadConvertedVttSubtitlesFileFailure
)
