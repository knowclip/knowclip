import { flatMap, map, mergeAll } from 'rxjs/operators'
import { of, Observable, from, empty } from 'rxjs'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { existsSync } from 'fs'
import { combineEpics, ofType } from 'redux-observable'
import project from '../files/projectFile'
import media from '../files/mediaFile'
import temporaryVtt from '../files/temporaryVttFile'
import externalSubtitles from '../files/externalSubtitlesFile'
import waveformPng from '../files/waveformPngFile'
import constantBitrateMp3 from '../files/constantBitrateMp3File'
import videoStillImage from '../files/videoStillImageFile'
import { FileEventHandlers } from '../files/eventHandlers'
import { getHumanFileName } from '../utils/files'

const fileEventHandlers: Record<
  FileMetadata['type'],
  FileEventHandlers<any>
> = {
  ProjectFile: project,
  MediaFile: media,
  ExternalSubtitlesFile: externalSubtitles,
  VttConvertedSubtitlesFile: temporaryVtt,
  WaveformPng: waveformPng,
  ConstantBitrateMp3: constantBitrateMp3,
  VideoStillImage: videoStillImage,
}

const openFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, OpenFileRequest>(A.OPEN_FILE_REQUEST),
    flatMap<OpenFileRequest, Observable<Action>>(action => {
      const { file } = action
      const fileAvailability = r.getFileAvailability(state$.value, file)

      if (!fileAvailability.isLoading) return empty()

      if (
        !fileAvailability.filePath ||
        !existsSync(fileAvailability.filePath)
      ) {
        const fileTypeAndName = getHumanFileName(file)
        const fileVerb = file.type === 'MediaFile' ? 'make clips with' : 'use'
        const message = fileAvailability.filePath
          ? `This ${fileTypeAndName} appears to have moved or been renamed. Try locating it manually?`
          : `Please locate your ${fileTypeAndName} in the filesystem so you can ${fileVerb} it.
              
              (If you're seeing this message, it's probably because you've recently opened this project for the first time on this computer.)`
        return of(r.locateFileRequest(file, message))
      }

      try {
        return from(
          fileEventHandlers[file.type].openRequest(
            action,
            fileAvailability.filePath,
            state$.value,
            effects
          )
        ).pipe(mergeAll())
      } catch (err) {
        return of(
          r.openFileFailure(
            file,
            fileAvailability.filePath,
            err.message || err.toString()
          )
        )
      }
    })
  )

const openFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, OpenFileSuccess>(A.OPEN_FILE_SUCCESS),
    flatMap(action =>
      from(
        fileEventHandlers[action.validatedFile.type].openSuccess.map(handler =>
          from(handler(action, state$.value, effects)).pipe(mergeAll())
        )
      )
    ),
    mergeAll()
  )

const openFileFailure: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, OpenFileFailure>(A.OPEN_FILE_FAILURE),
    flatMap<OpenFileFailure, Observable<Action>>(
      ({ file, filePath, errorMessage }) => {
        return of(r.simpleMessageSnackbar(errorMessage))
      }
    )
  )

const flatten = (asyncArray: Promise<Action[]>) =>
  from(asyncArray).pipe(flatMap(array => from(array)))

const locateFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LocateFileRequest>(A.LOCATE_FILE_REQUEST),
    flatMap<LocateFileRequest, Observable<Action>>(action =>
      flatten(
        fileEventHandlers[action.file.type].locateRequest(
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
    map<LocateFileSuccess, Action>(({ file, filePath }) =>
      r.openFileRequest(file)
    )
  )

const deleteFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, DeleteFileRequest>(A.DELETE_FILE_REQUEST),
    flatMap(({ fileType, id }) => {
      const file = r.getFile(state$.value, fileType, id)

      return file
        ? from(
            fileEventHandlers[fileType].deleteRequest.flatMap(handler =>
              from(
                handler(
                  file,
                  r.getFileDescendants(state$.value, file.id),
                  state$.value,
                  effects
                )
              ).pipe(mergeAll())
            )
          )
        : empty()
    }),
    mergeAll()
  )

const deleteFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, DeleteFileSuccess>(A.DELETE_FILE_SUCCESS),
    flatMap(action =>
      from(
        fileEventHandlers[action.file.type].deleteSuccess.flatMap(handler =>
          from(handler(action, state$.value, effects)).pipe(mergeAll())
        )
      )
    ),
    mergeAll()
  )
export default combineEpics(
  openFileRequest,
  openFileSuccess,
  openFileFailure,
  locateFileRequest,
  locateFileSuccess,
  deleteFileRequest,
  deleteFileSuccess
)
