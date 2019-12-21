import { flatMap, map, catchError } from 'rxjs/operators'
import { of, Observable, from, empty } from 'rxjs'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { existsSync } from 'fs'
import { combineEpics, ofType } from 'redux-observable'
// import * as project from '../files/projectFile'
import project from '../files/projectFile'
import media from '../files/mediaFile'
import temporaryVtt from '../files/temporaryVttFile'
import externalSubtitles from '../files/externalSubtitlesFile'
import waveformPng from '../files/waveformPngFile'
import constantBitrateMp3 from '../files/constantBitrateMp3File'
import { FileEventHandlers, FileValidator } from '../files/eventHandlers'

const addAndLoadFile: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddAndLoadFile>(A.ADD_AND_LOAD_FILE),
    map<AddAndLoadFile, Action>(({ fileRecord }) =>
      r.loadFileRequest(fileRecord)
    )
  )

const fileEventHandlers: Record<FileRecord['type'], FileEventHandlers<any>> = {
  ProjectFile: project,
  MediaFile: media,
  ExternalSubtitlesFile: externalSubtitles,
  TemporaryVttFile: temporaryVtt,
  WaveformPng: waveformPng,
  ConstantBitrateMp3: constantBitrateMp3,
  // VideoStillImage: ,
  // },
}

const defaultValidator = async <T>(
  fileRecord: T,
  filePath: string
): Promise<string | T> => fileRecord

const loadFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LoadFileRequest>(A.LOAD_FILE_REQUEST),
    flatMap<LoadFileRequest, Observable<Action>>(({ fileRecord }) => {
      const file = r.getPreviouslyLoadedFile(state$.value, fileRecord) // rename
      // if (!file)
      if (!file || !file.filePath || !existsSync(file.filePath))
        return of(r.locateFileRequest(fileRecord, `This file "${
          'name' in fileRecord ? fileRecord.name : fileRecord.type
          }" appears to have moved or been renamed. Try locating it manually?`))


      // const validate =
      //   from(
      //     validator(fileRecord, file.filePath)).pipe(
      //       map((errorOrRecord) => {
      //         // MOVE THIS TO INDIVIDUAL 
      //         if (typeof errorOrRecord === 'string')
      //           return r.confirmationDialog(errorOrRecord, r.loadFileSuccess(fileRecord, file.filePath))

      //         return r.loadFileSuccess(errorOrRecord, file.filePath)
      //       }),
      //       catchError((err) => {
      //         return of(

      //           r.loadFileFailure(
      //             fileRecord,
      //             file ? file.filePath : null,
      //             err && 'message' in err ? err.message : err.toString()
      //           )
      //         )
      //       }),
      //     )

      try {
        return flatten(
          fileEventHandlers[fileRecord.type].loadRequest(
            fileRecord, // maybe we send the VALIDATED file to here?
            // or should we just validate right inside the loadRequest handler?
            file.filePath,
            state$.value,
            effects
          )
        )
      } catch (err) {
        return of(
          r.loadFileFailure(
            fileRecord,
            file ? file.filePath : null,
            err.message || err.toString()
          )
        )
      }
    })
  )

const loadFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LoadFileSuccess>(A.LOAD_FILE_SUCCESS),
    flatMap<LoadFileSuccess, Observable<Action>>(({ validatedFileRecord: fileRecord, filePath }) =>
      fileEventHandlers[fileRecord.type].loadSuccess(
        fileRecord,
        filePath,
        state$.value,
        effects
      )
    )
  )

const loadFileFailure: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LoadFileFailure>(A.LOAD_FILE_FAILURE),
    flatMap<LoadFileFailure, Observable<Action>>(
      ({ fileRecord, filePath, errorMessage }) => {
        const hook = fileEventHandlers[fileRecord.type].loadFailure

        if (hook)
          return hook(fileRecord, filePath, errorMessage, state$.value, effects)

        return of(
          r.simpleMessageSnackbar(
            'Unimplemented file load failure hook ' + JSON.stringify(fileRecord)
          )
        )
      }
    )
  )

const flatten = (asyncArray: Promise<Action[]>) =>
  from(asyncArray).pipe(flatMap(array => from(array)))

const locateFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LocateFileRequest>(A.LOCATE_FILE_REQUEST),
    flatMap<LocateFileRequest, Observable<Action>>((action) =>
      flatten(
        fileEventHandlers[action.fileRecord.type].locateRequest(
          action,
          state$.value,
          effects
        )
      )
    )
  )

const locateFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LocateFileSuccess>(A.LOCATE_FILE_SUCCESS),
    map<LocateFileSuccess, Action>(({ fileRecord, filePath }) =>
      r.loadFileRequest(fileRecord)
    )
  )

export default combineEpics(
  addAndLoadFile,
  loadFileRequest,
  loadFileSuccess,
  loadFileFailure,
  locateFileRequest,
  locateFileSuccess
)
