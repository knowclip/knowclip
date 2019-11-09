import { map, catchError } from 'rxjs/operators'
import * as r from '../redux'
import { from, of, empty } from 'rxjs'
import {
  newExternalSubtitlesTrack,
  newEmbeddedSubtitlesTrack,
} from '../utils/subtitles'
import {
  LoadRequestHandler,
  LoadSuccessHandler,
  LoadFailureHandler,
  LocateRequestHandler,
} from './types'

export const loadRequest: LoadRequestHandler<TemporaryVttFileRecord> = async (
  fileRecord,
  filePath,
  state,
  effects
) => {
  const file = r.getPreviouslyLoadedFile(state, fileRecord)

  if (!file || !file.filePath) {
    const parentFile = r.getLoadedFileById(
      state,
      fileRecord.parentType,
      fileRecord.parentId
    )
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return await r.loadFileFailure(
        fileRecord,
        null,
        'You must first locate this file.'
      )

    const { chunks, vttFilePath } = await effects.getSubtitlesFromFile(
      parentFile.filePath,
      state
    )

    return r.loadFileSuccess(fileRecord, vttFilePath)
  }

  if (!file.filePath || !effects.existsSync(file.filePath))
    return await r.loadFileFailure(
      fileRecord,
      file.filePath,
      `This file appears to have moved or been renamed. y`
    )

  return await r.loadFileSuccess(fileRecord, file.filePath)
}

export const loadSuccess: LoadSuccessHandler<TemporaryVttFileRecord> = (
  fileRecord,
  filePath,
  state,
  effects
) =>
  from(effects.getSubtitlesFromFile(filePath, state))
    // const parentFileRecord = r.getFileRecord(
    //   state,
    //   fileRecord.parentType,
    //   fileRecord.id
    // ) //wronh\g
    // const parentFile = r.getPreviouslyLoadedFile(state
    .pipe(
      map(({ chunks, vttFilePath }) => {
        if (fileRecord.parentType === 'MediaFile')
          return r.addSubtitlesTrack(
            newEmbeddedSubtitlesTrack(
              fileRecord.id,
              fileRecord.parentId,
              chunks,
              fileRecord.streamIndex,
              vttFilePath
            )
          )

        const external = r.getFileRecord(
          state,
          'ExternalSubtitlesFile',
          fileRecord.parentId
        ) as ExternalSubtitlesFileRecord
        console.log({ external })
        return r.addSubtitlesTrack(
          newExternalSubtitlesTrack(
            fileRecord.id,
            external.parentId,
            chunks,
            vttFilePath,
            filePath
          )
        )
      })
    )

export const loadFailure: LoadFailureHandler<TemporaryVttFileRecord> = (
  fileRecord,
  filePath,
  errorMessage,
  state,
  effects
) => {
  // if parent file/media track exists
  const source = r.getLoadedFileById(
    state,
    fileRecord.parentType,
    fileRecord.parentId
  )
  if (source && source.status === 'CURRENTLY_LOADED') {
    //   try loading that again
    const sourceRecord:
      | MediaFileRecord
      | ExternalSubtitlesFileRecord
      | null = r.getFileRecord(
      state,
      fileRecord.parentType,
      fileRecord.parentId
    )
    // how to prevent infinite loop?
    if (!sourceRecord) return of(r.simpleMessageSnackbar(errorMessage))

    switch (fileRecord.parentType) {
      case 'MediaFile':
        return from(
          effects.getSubtitlesFromMedia(
            source.filePath,
            fileRecord.streamIndex,
            state
          )
        ).pipe(
          map(({ tmpFilePath, chunks }) =>
            r.addFile(
              // should probably not be repeated in mediaFile.ts
              {
                type: 'TemporaryVttFile',
                parentId: fileRecord.parentId,
                id: fileRecord.id,
                streamIndex: fileRecord.streamIndex,
                parentType: 'MediaFile',
              },
              tmpFilePath
            )
          )
          // catchError((err) => r.)
        )
      case 'ExternalSubtitlesFile':
        return from(effects.getSubtitlesFromFile(source.filePath, state)).pipe(
          map(({ vttFilePath, chunks }) =>
            r.addFile(
              // should probably not be repeated in mediaFile.ts
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
      default:
        return empty()
    }
    // else
  } else {
    //   delete file record, suggest retry?
    return of(r.simpleMessageSnackbar(errorMessage))
  }
}

// export const locateRequest : LocateRequestHandler= (fileRecord, state, effects) => {
//   const source =
// }
