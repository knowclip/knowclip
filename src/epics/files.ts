import { mergeMap, map, mergeAll, catchError } from 'rxjs/operators'
import { of, from, EMPTY, defer } from 'rxjs'
import r from '../redux'
import A from '../types/ActionType'
import { combineEpics, ofType } from 'redux-observable'
import project from '../files/projectFile'
import media from '../files/mediaFile'
import temporaryVtt from '../files/temporaryVttFile'
import externalSubtitles from '../files/externalSubtitlesFile'
import waveformPng from '../files/waveformPngFile'
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
  VideoStillImage: videoStillImage,
  Dictionary: dictionaryActions,
}

const openFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.openFileRequest as const),
    mergeMap(async (action) => {
      const file =
        r.getFile(state$.value, action.file.type, action.file.id) || action.file
      const fileAvailability = r.getFileAvailability(state$.value, file)

      if (!fileAvailability.isLoading) return EMPTY

      const filePath = action.filePath || fileAvailability.filePath

      if (!filePath || !(await effects.fileExists(filePath)).value) {
        const fileTypeAndName = getHumanFileName(file)
        const fileVerb = file.type === 'MediaFile' ? 'make clips with' : 'use'
        const message = filePath
          ? `This ${fileTypeAndName} appears to have moved or been renamed. Try locating it manually?`
          : `Please locate your ${fileTypeAndName} in the filesystem so you can ${fileVerb} it.
              
              (If you're seeing this message, it's probably because you've recently opened this project for the first time on this computer.)`
        return of(r.locateFileRequest(file, message))
      }

      try {
        const fileRegisterResult = await effects.sendToMainProcess({
          type: 'registerFilePath',
          args: [file.id, filePath],
        })
        if (fileRegisterResult.error) {
          throw fileRegisterResult.error
        }

        return from(
          fileEventHandlers[file.type].openRequest(
            file,
            filePath,
            state$.value,
            effects
          )
        ).pipe(mergeAll())
      } catch (err) {
        return of(r.openFileFailure(file, filePath, String(err)))
      }
    }),
    mergeAll()
  )

const openFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.openFileSuccess as const),
    mergeMap((action) => {
      const openSuccessHandlers: OpenFileSuccessHandler<
        typeof action.validatedFile
      >[] = fileEventHandlers[action.validatedFile.type].openSuccess

      return from(
        openSuccessHandlers.map((handler) =>
          defer(() => {
            const state = state$.value
            const file = r.getFile(
              state,
              action.validatedFile.type,
              action.validatedFile.id
            )

            return file ? handler(file, action.filePath, state, effects) : EMPTY
          }).pipe(mergeAll())
        )
      )
    }),
    mergeAll()
  )

const openFileFailure: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.openFileFailure as const),
    mergeMap((action) => {
      const openFailureHandler = fileEventHandlers[action.file.type].openFailure

      console.error(
        `Could not open ${action.file.type}: ${action.errorMessage}`
      )
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
    ofType(A.locateFileRequest as const),
    mergeMap((action) => {
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

const locateFileSuccess: AppEpic = (action$, _state$, _effects) =>
  action$.pipe(
    ofType(A.locateFileSuccess as const),
    map(({ file }) => r.openFileRequest(file))
  )

const deleteFileRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.deleteFileRequest as const),
    mergeMap(({ fileType, id }) => {
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
        : EMPTY
    }),
    mergeAll()
  )

const deleteFileSuccess: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.deleteFileSuccess as const),
    mergeMap((action) =>
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
