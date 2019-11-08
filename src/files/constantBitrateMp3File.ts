import { map, catchError } from 'rxjs/operators'
import { of, empty } from 'rxjs'
import * as r from '../redux'
import { from } from 'rxjs'

import { LoadRequestHandler, LoadSuccessHandler } from './types'

export const loadRequest: LoadRequestHandler<ConstantBitrateMp3Record> = async (
  fileRecord,
  filePath,
  state,
  effects
) => {
  const file = r.getPreviouslyLoadedFile(state, fileRecord)

  if (!file || !file.filePath) {
    const parentFile = r.getLoadedFileById(state, 'MediaFile', fileRecord.id)
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return await r.loadFileFailure(
        fileRecord,
        null,
        'You must first locate this file.'
      )
    const cbrFilePath = await effects.getConstantBitrateMediaPath(
      parentFile.filePath,
      null
    )

    return r.loadFileSuccess(fileRecord, cbrFilePath)
  }

  if (!file.filePath || !effects.existsSync(file.filePath))
    return await r.loadFileFailure(
      fileRecord,
      file.filePath,
      `This file appears to have moved or been renamed. y`
    )

  return await r.loadFileSuccess(fileRecord, file.filePath)
}

export const loadSuccess: LoadSuccessHandler<ConstantBitrateMp3Record> = (
  fileRecord,
  filePath,
  state,
  effects
) => {
  const cbrPath = r.getMediaFileConstantBitratePathFromCurrentProject(
    state,
    fileRecord.id
  ) as string
  return cbrPath
    ? from(effects.getWaveformPng(state, cbrPath)).pipe(
        map(imagePath =>
          r.addFile(
            {
              type: 'WaveformPng',
              parentId: fileRecord.id,
              id: fileRecord.id,
            },
            imagePath
          )
        ),
        catchError(err => of(r.simpleMessageSnackbar(err.message)))
      )
    : empty()
}
