import { map } from 'rxjs/operators'
import * as r from '../redux'
import { from } from 'rxjs'
import {
  newExternalSubtitlesTrack,
  newEmbeddedSubtitlesTrack,
} from '../utils/subtitles'
import {
  LoadRequestHandler,
  LoadSuccessHandler,
  LocateRequestHandler,
  FileEventHandlers,
} from './eventHandlers'

const loadRequest: LoadRequestHandler<TemporaryVttFileRecord> = async (
  fileRecord,
  filePath,
  state,
  effects
) => {
  const parentFile = r.getLoadedFileById(
    state,
    fileRecord.parentType,
    fileRecord.parentId
  )
  if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
    return [
      await r.loadFileFailure(
        fileRecord,
        null,
        'You must first locate this file.'
      ),
    ]

  const vttFilePath = await effects.getSubtitlesFilePath(
    state,
    parentFile.filePath,
    fileRecord
  )

  return [r.loadFileSuccess(fileRecord, vttFilePath)]
}

const loadSuccess: LoadSuccessHandler<TemporaryVttFileRecord> = (
  fileRecord,
  filePath,
  state,
  effects
) => {
  const sourceFile = r.getLoadedFileById(
    state,
    fileRecord.parentType,
    fileRecord.parentId
  ) as CurrentlyLoadedFile
  return from(effects.getSubtitlesFromFile(state, filePath)).pipe(
    map(chunks => {
      if (fileRecord.parentType === 'MediaFile')
        return r.addSubtitlesTrack(
          newEmbeddedSubtitlesTrack(
            fileRecord.id,
            fileRecord.parentId,
            chunks,
            fileRecord.streamIndex,
            filePath
          )
        )

      const external = r.getFileRecord(
        state,
        'ExternalSubtitlesFile',
        fileRecord.parentId
      ) as ExternalSubtitlesFileRecord
      return r.addSubtitlesTrack(
        newExternalSubtitlesTrack(
          fileRecord.id,
          external.parentId,
          chunks,
          sourceFile.filePath,
          filePath
        )
      )
    })
  )
}
const locateRequest: LocateRequestHandler<TemporaryVttFileRecord> = async (
  { fileRecord },
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
    if (!sourceRecord)
      return [r.simpleMessageSnackbar('No source subtitles file ')]

    switch (fileRecord.parentType) {
      case 'MediaFile': {
        return await Promise.all(
          (sourceRecord as MediaFileRecord).subtitlesTracksStreamIndexes.map(
            async streamIndex => {
              const tmpFilePath = await effects.getSubtitlesFilePath(
                state,
                source.filePath,
                fileRecord
              )
              return r.locateFileSuccess(fileRecord, tmpFilePath)
            }
          )
        )
      }
      case 'ExternalSubtitlesFile':
        const tmpFilePath = await effects.getSubtitlesFilePath(
          state,
          source.filePath,
          fileRecord
        )
        return [r.locateFileSuccess(fileRecord, tmpFilePath)]
      default:
        //   delete file record, suggest retry?
        return [r.simpleMessageSnackbar('Whoops no valid boop source??')]

      // else
    }
  }
  return [r.simpleMessageSnackbar('Whoops no valid boop source??')]
}

export default {
  loadRequest,
  loadSuccess,
  loadFailure: null,
  locateRequest,
  locateSuccess: null,
} as FileEventHandlers<TemporaryVttFileRecord>
