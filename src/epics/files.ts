import { flatMap, map, mergeAll } from 'rxjs/operators'
import { of, Observable, from, empty } from 'rxjs'
import r from '../redux'
import A from '../types/ActionType'
import { existsSync } from 'fs'
import { combineEpics, ofType } from 'redux-observable'
import project from '../files/projectFile'
import media from '../files/mediaFile'
import temporaryVtt from '../files/temporaryVttFile'
import externalSubtitles from '../files/externalSubtitlesFile'
import waveformPng from '../files/waveformPngFile'
import constantBitrateMp3 from '../files/constantBitrateMp3File'
import videoStillImage from '../files/videoStillImageFile'
import { dictionaryActions } from '../files/dictionaryFile'
import {
  FileEventHandlers,
  OpenFileSuccessHandler,
} from '../files/eventHandlers'
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
  Dictionary: dictionaryActions,
}

const openFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, OpenFileRequest>(A.openFileRequest),
    flatMap<OpenFileRequest, Observable<Action>>((action) => {
      const file =
        r.getFile(state$.value, action.file.type, action.file.id) || action.file
      const fileAvailability = r.getFileAvailability(state$.value, file)

      if (!fileAvailability.isLoading) return empty()

      const filePath = action.filePath || fileAvailability.filePath

      if (!filePath || !existsSync(filePath)) {
        const fileTypeAndName = getHumanFileName(file)
        const fileVerb = file.type === 'MediaFile' ? 'make clips with' : 'use'
        const message = filePath
          ? `This ${fileTypeAndName} appears to have moved or been renamed. Try locating it manually?`
          : `Please locate your ${fileTypeAndName} in the filesystem so you can ${fileVerb} it.
              
              (If you're seeing this message, it's probably because you've recently opened this project for the first time on this computer.)`
        return of(r.locateFileRequest(file, message))
      }

      try {
        return from(
          fileEventHandlers[file.type].openRequest(
            file,
            filePath,
            state$.value,
            effects
          )
        ).pipe(mergeAll())
      } catch (err) {
        return of(
          r.openFileFailure(file, filePath, err.message || err.toString())
        )
      }
    })
  )

const openFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, OpenFileSuccess>(A.openFileSuccess),
    flatMap((action) => {
      const openSuccessHandlers: OpenFileSuccessHandler<
        typeof action.validatedFile
      >[] = fileEventHandlers[action.validatedFile.type].openSuccess

      const file =
        r.getFile(
          state$.value,
          action.validatedFile.type,
          action.validatedFile.id
        ) || action.validatedFile

      return from(
        openSuccessHandlers.map((handler) =>
          from(handler(file, action.filePath, state$.value, effects)).pipe(
            mergeAll()
          )
        )
      )
    }),
    mergeAll()
  )

const openFileFailure: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, OpenFileFailure>(A.openFileFailure),
    flatMap<OpenFileFailure, Observable<Action>>((action) => {
      const openFailureHandler = fileEventHandlers[action.file.type].openFailure

      console.error(action.errorMessage || 'Could not open file:')
      console.log(action)

      const file =
        r.getFile(state$.value, action.file.type, action.file.id) || action.file

      return openFailureHandler
        ? from(
            openFailureHandler(
              file,
              action.filePath,
              action.errorMessage,
              state$.value,
              effects
            )
          ).pipe(mergeAll())
        : from(
            action.errorMessage
              ? [r.simpleMessageSnackbar(action.errorMessage)]
              : []
          )
    })
  )

const flatten = (asyncArray: Promise<Action[]>) =>
  from(asyncArray).pipe(mergeAll())

const locateFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LocateFileRequest>(A.locateFileRequest),
    flatMap<LocateFileRequest, Observable<Action>>((action) => {
      const file =
        r.getFile(state$.value, action.file.type, action.file.id) || action.file

      return flatten(
        fileEventHandlers[action.file.type].locateRequest(
          file,
          r.getFileAvailability(state$.value, action.file),
          action.message,
          state$.value,
          effects
        )
      )
    })
  )

const locateFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, LocateFileSuccess>(A.locateFileSuccess),
    map<LocateFileSuccess, Action>(({ file, filePath }) =>
      r.openFileRequest(file)
    )
  )

const deleteFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, DeleteFileRequest>(A.deleteFileRequest),
    flatMap(({ fileType, id }) => {
      const availability = r.getFileAvailabilityById(state$.value, fileType, id)

      return availability
        ? from(
            fileEventHandlers[fileType].deleteRequest.flatMap((handler) =>
              from(
                handler(
                  r.getFile(state$.value, fileType, id),
                  availability,
                  r.getFileDescendants(state$.value, availability.id),
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
    ofType<Action, DeleteFileSuccess>(A.deleteFileSuccess),
    flatMap((action) =>
      from(
        fileEventHandlers[action.file.type].deleteSuccess.flatMap((handler) =>
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
