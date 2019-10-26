import { filter, flatMap, map, catchError } from 'rxjs/operators'
import { of, Observable, merge, empty } from 'rxjs'
import * as r from '../redux'
import { from } from 'rxjs'
import { AppEpic } from '../types/AppEpic'
import {
  getSubtitlesFromFile,
  newExternalSubtitlesTrack,
  newEmbeddedSubtitlesTrack,
  getSubtitlesFromMedia,
} from './subtitles'
import { existsSync } from 'fs'
import {
  isLoadFileRequest,
  isLoadFileFailure,
  isLocateFileRequest,
} from '../utils/files'
import { combineEpics, ofType } from 'redux-observable'
import { extname, basename } from 'path'
import uuid from 'uuid'
import { getWaveformPng } from './getWaveform'

const addFile: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddFile>(A.ADD_FILE),
    map<AddFile, Action>(({ fileRecord }) => r.loadFileRequest(fileRecord))
  )

const isVtt = (filePath: FilePath) => extname(filePath) === '.vtt'

const loadFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LoadFileRequest>(A.LOAD_FILE_REQUEST),

    // if filepath provided, try to locate file
    //   if filepath valid, loadFileSuccess
    //   if filepath invalid, do file-generating or file-finding action for particular file type
    // if no filepath provided, do file-generating or file-finding action for particular file type
    flatMap<LoadFileRequest, Promise<Action>>(async ({ fileRecord }) => {
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
        switch (fileRecord.type) {
          case 'MediaFile': {
            effects.pauseMedia()
            // mediaPlayer.src = ''
            return await r.loadFileSuccess(fileRecord, file.filePath)
          }

          case 'ExternalSubtitlesFile':
          case 'TemporaryVttFile':
          default:
            return await r.loadFileSuccess(fileRecord, file.filePath)
        }
      } catch (err) {
        return await r.loadFileFailure(
          fileRecord,
          file ? file.filePath : null,
          err.message || err.toString()
        )
      }
    })
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
    flatMap<LoadFileSuccess, Observable<Action>>(({ fileRecord, filePath }) => {
      switch (fileRecord.type) {
        case 'MediaFile': {
          const { subtitlesTracksStreamIndexes, id } = fileRecord
          const addSubtitlesFiles = from(
            subtitlesTracksStreamIndexes
              // .filter(
              //   streamIndex =>
              //     !Object.values(state$.value.fileRecords.TemporaryVttFile).some(
              //       a =>
              //         a.type === 'TemporaryVttFile' &&
              //         a.parentType === 'EmbeddedSubtitlesTrack' &&
              //         a.streamIndex === streamIndex
              //     )
              // )
              .map(async streamIndex => {
                const { tmpFilePath, chunks } = await getSubtitlesFromMedia(
                  filePath,
                  streamIndex,
                  state$.value
                )
                return r.addFile(
                  {
                    type: 'TemporaryVttFile',
                    parentId: id,
                    id: uuid(),
                    streamIndex,
                    parentType: 'EmbeddedSubtitlesTrack',
                  },
                  tmpFilePath
                )
                // or load existing
              })
          ).pipe(flatMap(x => x))
          const cbrPath = r.getMediaFileConstantBitratePathFromCurrentProject(
            state$.value,
            fileRecord.id
          ) as string

          const getWaveform = cbrPath
            ? from(getWaveformPng(state$.value, cbrPath)).pipe(
                map(imagePath => r.setWaveformImagePath(imagePath)),
                catchError(err => of(r.simpleMessageSnackbar(err.message)))
              )
            : empty()

          const fileName = r.getCurrentFileName(state$.value)

          return merge(
            addSubtitlesFiles,
            getWaveform,
            of({
              type: 'SET_DEFAULT_TAGS',
              tags: fileName ? [basename(fileName)] : [],
            } as SetDefaultTags)
            // of(r.addMedi)
          )
        }

        case 'ExternalSubtitlesFile': {
          if (isVtt(filePath)) {
            return from(getSubtitlesFromFile(filePath, state$.value)).pipe(
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
              state$.value,
              'TemporaryVttFile',
              fileRecord.id
            )

            return temporaryVttFileRecord
              ? of(r.loadFileRequest(temporaryVttFileRecord))
              : of(
                  r.addFile(
                    {
                      type: 'TemporaryVttFile',
                      id: fileRecord.id,
                      parentId: fileRecord.id, // not needed?
                      parentType: 'ExternalSubtitlesTrack',
                    },
                    null
                  )
                )
          }
        }
        case 'TemporaryVttFile': {
          return (
            from(getSubtitlesFromFile(filePath, state$.value))
              // const parentFileRecord = r.getFileRecord(
              //   state$.value,
              //   fileRecord.parentType,
              //   fileRecord.id
              // ) //wronh\g
              // const parentFile = r.getPreviouslyLoadedFile(state$.value)
              .pipe(
                map(({ chunks, vttFilePath }) =>
                  r.addSubtitlesTrack(
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
                )
              )
          )
        }
        default:
          return of(
            r.simpleMessageSnackbar('Unimplemented file load success hook')
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
      //       : r.addFile(
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
    })
  )

// or should be loadSubtitlesFromFileRequest?
const locateSubtitlesFileRequest: AppEpic = (action$, state$) =>
  action$.pipe(
    // filter<Action, AddFileRequest<ExternalSubtitlesFileRecord>>(
    //   isAddFile<ExternalSubtitlesFileRecord>('ExternalSubtitlesFile')
    // ),
    filter(isLocateFileRequest('ExternalSubtitlesFile')),
    flatMap<
      LocateFileRequest & { fileRecord: ExternalSubtitlesFileRecord },
      Promise<Observable<Action>>
    >(async ({ filePath, fileRecord }) => {
      try {
        const { chunks, vttFilePath } = await getSubtitlesFromFile(
          filePath,
          state$.value
        )

        const actions: Action[] = [
          // r.loadExternalSubtitlesSuccess(fileRecord),
          // r.locateFileSuccess(fileRecord, filePat)
          //
          // r.addFile<ExternalSubtitlesFileRecord>(
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
  addFile,
  loadFileRequest,
  loadSubtitlesFileFailure,
  loadFileSuccess,
  locateSubtitlesFileRequest,
  loadConvertedVttSubtitlesFileRequest,
  loadConvertedVttSubtitlesFileFailure
)
