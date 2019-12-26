import { of } from 'rxjs'
import * as r from '../redux'

import { FileEventHandlers } from './eventHandlers'

export default {
  openRequest: async (file, filePath, state, effects) => {
    return [r.openFileSuccess(file, filePath)]
  },

  openSuccess: (file, filePath, state, effects) => {
    return of(
      r.addAndOpenFile({
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
        r.openFileFailure(file, null, 'You must first locate this file.'), // TODO: test!!! maybe should delete?
      ]

    const cbrFilePath = await effects.getConstantBitrateMediaPath(
      parentFile.filePath,
      null
    )
    return [r.locateFileSuccess(file, cbrFilePath)]
  },

  openFailure: null,
  locateSuccess: null,
} as FileEventHandlers<ConstantBitrateMp3>
