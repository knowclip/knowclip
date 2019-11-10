import { of } from 'rxjs'
import * as r from '../redux'

import {
  LoadRequestHandler,
  LoadSuccessHandler,
  LocateRequestHandler,
} from './types'

export const loadRequest: LoadRequestHandler<ConstantBitrateMp3Record> = async (
  fileRecord,
  filePath,
  state,
  effects
) => {
  return r.loadFileSuccess(fileRecord, filePath)
}

export const loadSuccess: LoadSuccessHandler<ConstantBitrateMp3Record> = (
  fileRecord,
  filePath,
  state,
  effects
) => {
  return of(
    r.addFile({
      type: 'WaveformPng',
      parentId: fileRecord.id,
      id: fileRecord.id,
    })
  )
}

export const locateRequest: LocateRequestHandler<
  ConstantBitrateMp3Record
> = async (fileRecord, state, effects) => {
  const parentFile = r.getLoadedFileById(state, 'MediaFile', fileRecord.id)
  if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
    return await [
      r.loadFileFailure(fileRecord, null, 'You must first locate this file.'),
    ]
  const cbrFilePath = await effects.getConstantBitrateMediaPath(
    parentFile.filePath,
    null
  )
  return [r.locateFileSuccess(fileRecord, cbrFilePath)]
}
