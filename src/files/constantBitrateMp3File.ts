import * as r from '../redux'

import { FileEventHandlers } from './eventHandlers'

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    return [r.openFileSuccess(file, filePath)]
  },

  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      // TODO:  break up big PNGs
      const waveform = r.getFile(state, 'WaveformPng', validatedFile.id)
      return [
        r.openFileRequest(
          waveform || {
            type: 'WaveformPng',
            parentId: validatedFile.id,
            id: validatedFile.id,
          }
        ),
      ]
    },
  ],

  locateRequest: async ({ file }, availability, state, effects) => {
    const parentFile = r.getFileAvailabilityById(state, 'MediaFile', file.id)
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return await [r.openFileFailure(file, null, null)]

    const cbrFilePath = await effects.getConstantBitrateMediaPath(
      parentFile.filePath,
      null
    )
    return [r.locateFileSuccess(file, cbrFilePath)]
  },
} as FileEventHandlers<ConstantBitrateMp3>
