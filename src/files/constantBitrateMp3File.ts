import { of } from 'rxjs'
import * as r from '../redux'

import { FileEventHandlers } from './eventHandlers'

export default {
  loadRequest: async (fileRecord, filePath, state, effects) => {
    return [r.loadFileSuccess(fileRecord, filePath)]
  },

  loadSuccess: (fileRecord, filePath, state, effects) => {
    return of(
      r.addAndLoadFile({
        type: 'WaveformPng',
        parentId: fileRecord.id,
        id: fileRecord.id,
      })
    )
  },

  locateRequest: async ({ fileRecord }, state, effects) => {
    const parentFile = r.getLoadedFileById(state, 'MediaFile', fileRecord.id)
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return await [
        r.loadFileFailure(fileRecord, null, 'You must first locate this file.'), // TODO: test!!! maybe should delete?
      ]

    const cbrFilePath = await effects.getConstantBitrateMediaPath(
      parentFile.filePath,
      null
    )
    return [r.locateFileSuccess(fileRecord, cbrFilePath)]
  },

  loadFailure: null,
  locateSuccess: null,
} as FileEventHandlers<ConstantBitrateMp3Record>
