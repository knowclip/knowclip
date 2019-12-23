import { of } from 'rxjs'
import * as r from '../redux'

import { FileEventHandlers } from './eventHandlers'

export default {
  loadRequest: async (file, filePath, state, effects) => {
    return [r.loadFileSuccess(file, filePath)]
  },

  loadSuccess: (file, filePath, state, effects) => {
    return of(
      r.addAndLoadFile({
        type: 'WaveformPng',
        parentId: file.id,
        id: file.id,
      })
    )
  },

  locateRequest: async ({ file }, state, effects) => {
    const parentFile = r.getFileAvailabilityById(state, 'MediaFile', file.id)
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return await [
        r.loadFileFailure(file, null, 'You must first locate this file.'), // TODO: test!!! maybe should delete?
      ]

    const cbrFilePath = await effects.getConstantBitrateMediaPath(
      parentFile.filePath,
      null
    )
    return [r.locateFileSuccess(file, cbrFilePath)]
  },

  loadFailure: null,
  locateSuccess: null,
} as FileEventHandlers<ConstantBitrateMp3>
