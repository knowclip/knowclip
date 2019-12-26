import * as r from '../redux'

import { FileEventHandlers } from './eventHandlers'

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    return [await r.openFileSuccess(file, filePath)]
  },
  openSuccess: [],
  locateRequest: async ({ file }, state, effects) => {
    try {
      const parentFile = r.getFileAvailabilityById(state, 'MediaFile', file.id)
      if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
        return [
          r.openFileFailure(file, null, 'You must first locate this file.'),
        ]

      const cbr = r.getConstantBitrateFilePath(state, parentFile.id)

      return cbr
        ? [
            r.locateFileSuccess(
              file,
              await effects.getWaveformPng(state, file, cbr)
            ),
          ]
        : []
    } catch (err) {
      return [
        r.openFileFailure(file, null, 'whoops couldnt make waveform image'),
      ]
    }
  },
  locateSuccess: null,
  deleteRequest: [],
  deleteSuccess: null,
} as FileEventHandlers<WaveformPng>
