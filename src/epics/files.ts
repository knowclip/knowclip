import { flatMap, map } from 'rxjs/operators'
import { of, Observable, from } from 'rxjs'
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
import { FileEventHandlers } from '../files/types'

const addFile: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddFile>(A.ADD_FILE),
    // map<AddFile, Action>(({ fileRecord }) => r.loadFileRequest(fileRecord))
    // should succeed because add file adds file to loaded files state ??
    map<AddFile, Action>(({ fileRecord }) => r.loadFileRequest(fileRecord))
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

const loadFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LoadFileRequest>(A.LOAD_FILE_REQUEST),

    // if filepath provided, try to locate file
    //   if filepath valid, loadFileSuccess
    //   if filepath invalid, do file-generating or file-finding action for particular file type
    // if no filepath provided, do file-generating or file-finding action for particular file type
    flatMap<LoadFileRequest, Observable<Action>>(({ fileRecord }) => {
      const file = r.getPreviouslyLoadedFile(state$.value, fileRecord) // rename
      // if (!file)
      if (!file || !file.filePath || !existsSync(file.filePath))
        return of(r.locateFileRequest(fileRecord))

      try {
        return flatten(
          fileEventHandlers[fileRecord.type].loadRequest(
            fileRecord,
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
    flatMap<LoadFileSuccess, Observable<Action>>(({ fileRecord, filePath }) =>
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
    flatMap<LocateFileRequest, Observable<Action>>(({ fileRecord }) =>
      flatten(
        fileEventHandlers[fileRecord.type].locateRequest(
          fileRecord,
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
  addFile,
  loadFileRequest,
  loadFileSuccess,
  loadFileFailure,
  locateFileRequest,
  locateFileSuccess
)
