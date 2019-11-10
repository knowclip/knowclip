import { flatMap, map } from 'rxjs/operators'
import { of, Observable, from } from 'rxjs'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { existsSync } from 'fs'
import { combineEpics, ofType } from 'redux-observable'
import * as media from '../files/mediaFile'
import * as temporaryVtt from '../files/temporaryVttFile'
import * as externalSubtitles from '../files/externalSubtitlesFile'
import * as waveformPng from '../files/waveformPngFile'
import * as constantBitrateMp3 from '../files/constantBitrateMp3File'

const addFile: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddFile>(A.ADD_FILE),
    // map<AddFile, Action>(({ fileRecord }) => r.loadFileRequest(fileRecord))
    // should succeed because add file adds file to loaded files state ??
    map<AddFile, Action>(({ fileRecord }) => r.loadFileRequest(fileRecord))
  )

const loadFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LoadFileRequest>(A.LOAD_FILE_REQUEST),

    // if filepath provided, try to locate file
    //   if filepath valid, loadFileSuccess
    //   if filepath invalid, do file-generating or file-finding action for particular file type
    // if no filepath provided, do file-generating or file-finding action for particular file type
    flatMap<LoadFileRequest, Promise<Action>>(async ({ fileRecord }) => {
      const file = r.getPreviouslyLoadedFile(state$.value, fileRecord) // rename
      // if (!file)
      if (!file || !file.filePath || !existsSync(file.filePath))
        return await r.locateFileRequest(fileRecord)

      try {
        switch (fileRecord.type) {
          case 'MediaFile':
            return media.loadRequest(
              fileRecord,
              file.filePath,
              state$.value,
              effects
            )

          case 'TemporaryVttFile':
            return temporaryVtt.loadRequest(
              fileRecord,
              file.filePath,
              state$.value,
              effects
            )

          case 'WaveformPng':
            return waveformPng.loadRequest(
              fileRecord,
              file.filePath,
              state$.value,
              effects
            )

          case 'ConstantBitrateMp3':
            return constantBitrateMp3.loadRequest(
              fileRecord,
              file.filePath,
              state$.value,
              effects
            )

          case 'ExternalSubtitlesFile':
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

const loadFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LoadFileSuccess>(A.LOAD_FILE_SUCCESS),
    flatMap<LoadFileSuccess, Observable<Action>>(({ fileRecord, filePath }) => {
      switch (fileRecord.type) {
        case 'MediaFile': {
          return media.loadSuccess(fileRecord, filePath, state$.value, effects)
        }

        case 'ExternalSubtitlesFile': {
          return externalSubtitles.loadSuccess(
            fileRecord,
            filePath,
            state$.value,
            effects
          )
        }
        case 'TemporaryVttFile': {
          return temporaryVtt.loadSuccess(
            fileRecord,
            filePath,
            state$.value,
            effects
          )
        }

        case 'WaveformPng':
          return waveformPng.loadSuccess(
            fileRecord,
            filePath,
            state$.value,
            effects
          )

        case 'ConstantBitrateMp3':
          return constantBitrateMp3.loadSuccess(
            fileRecord,
            filePath,
            state$.value,
            effects
          )

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

const loadFileFailure: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LoadFileFailure>(A.LOAD_FILE_FAILURE),
    flatMap<LoadFileFailure, Observable<Action>>(
      ({ fileRecord, filePath, errorMessage }) => {
        switch (fileRecord.type) {
          // case 'MediaFile': {
          //   return media.loadFailure(
          //     fileRecord,
          //     filePath,
          //     errorMessage,
          //     state$.value,
          //     effects
          //   )
          // }

          case 'ExternalSubtitlesFile': {
            return externalSubtitles.loadFailure(
              fileRecord,
              filePath,
              errorMessage,
              state$.value,
              effects
            )
          }
          // case 'TemporaryVttFile': {
          //   return temporaryVtt.loadFailure(
          //     fileRecord,
          //     filePath,
          //     errorMessage,
          //     state$.value,
          //     effects
          //   )
          // }

          // case 'WaveformPng':
          //   return waveformPng.loadFailure(
          //     fileRecord,
          //     filePath,
          //     errorMessage,
          //     state$.value,
          //     effects
          //   )

          default:
            return of(
              r.simpleMessageSnackbar(
                'Unimplemented file load failure hook ' +
                  JSON.stringify(fileRecord)
              )
            )
        }
      }
    )
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

const flatten = (asyncArray: Promise<Action[]>) =>
  from(asyncArray).pipe(flatMap(array => from(array)))

const locateFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LocateFileRequest>(A.LOCATE_FILE_REQUEST),
    flatMap<LocateFileRequest, Observable<Action>>(({ fileRecord }) => {
      switch (fileRecord.type) {
        case 'MediaFile':
          return flatten(media.locateRequest(fileRecord, state$.value, effects))

        case 'ExternalSubtitlesFile':
          return flatten(
            externalSubtitles.locateRequest(fileRecord, state$.value, effects)
          )

        case 'TemporaryVttFile':
          return flatten(
            temporaryVtt.locateRequest(fileRecord, state$.value, effects)
          )

        case 'WaveformPng':
          return flatten(
            waveformPng.locateRequest(fileRecord, state$.value, effects)
          )

        case 'ConstantBitrateMp3':
          return flatten(
            constantBitrateMp3.locateRequest(fileRecord, state$.value, effects)
          )

        default:
          return of(
            r.simpleMessageSnackbar(
              'Unimplemented file locate request hook ' +
                JSON.stringify(fileRecord)
            )
          )
      }
    })
  )

const locateFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LocateFileSuccess>(A.LOCATE_FILE_SUCCESS),
    map<LocateFileSuccess, Action>(({ fileRecord, filePath }) =>
      r.loadFileRequest(fileRecord)
    )
  )

export default combineEpics(
  addFile,
  loadFileRequest,
  loadFileSuccess,
  loadFileFailure,
  locateFileRequest,
  locateFileSuccess
)
