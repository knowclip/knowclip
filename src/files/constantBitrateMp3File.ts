import * as r from '../redux'

import { FileEventHandlers } from './eventHandlers'
import { getWaveformPngs } from '../utils/getWaveform'

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    return [r.openFileSuccess(file, filePath)]
  },

  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      const sourceFile = r.getFile<MediaFile>(
        state,
        'MediaFile',
        validatedFile.id
      )
      if (!sourceFile) return []

      return [r.generateWaveformImages(getWaveformPngs(sourceFile))]
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
