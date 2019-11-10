import { map } from 'rxjs/operators'
import * as r from '../redux'
import { from, of } from 'rxjs'
import { newExternalSubtitlesTrack } from '../utils/subtitles'
import {
  LoadSuccessHandler,
  LoadFailureHandler,
  LocateRequestHandler,
} from './types'
import { extname } from 'path'

const isVtt = (filePath: FilePath) => extname(filePath) === '.vtt'

export const loadSuccess: LoadSuccessHandler<ExternalSubtitlesFileRecord> = (
  fileRecord,
  filePath,
  state,
  effects
) => {
  if (isVtt(filePath)) {
    return from(effects.getSubtitlesFromFile(state, filePath)).pipe(
      map(chunks =>
        r.addSubtitlesTrack(
          newExternalSubtitlesTrack(
            fileRecord.id,
            fileRecord.parentId,
            chunks,
            filePath,
            filePath
          )
        )
      )
    )
  } else {
    return of(
      r.addFile({
        type: 'TemporaryVttFile',
        id: fileRecord.id,
        parentId: fileRecord.id, // not needed?
        parentType: 'ExternalSubtitlesFile',
      })
    )
  }
}

export const loadFailure: LoadFailureHandler<ExternalSubtitlesFileRecord> = (
  fileRecord,
  filePath,
  errorMessage,
  state,
  effects
) => of(r.fileSelectionDialog(errorMessage, fileRecord))

export const locateRequest: LocateRequestHandler<
  ExternalSubtitlesFileRecord
> = async (fileRecord, state, effects) => {
  return [
    r.fileSelectionDialog(
      `This subtitles file ${
        fileRecord.name
      } appears to have moved or been renamed. Try locating it manually?`,
      fileRecord
    ),
  ]
}
