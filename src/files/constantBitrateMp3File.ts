import * as r from '../redux'

import { FileEventHandlers } from './eventHandlers'

const eventHandlers: FileEventHandlers<ConstantBitrateMp3> = {
  openRequest: async ({ file }, filePath, state, effects) => {
    return [r.openFileSuccess(file, filePath)]
  },

  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      return []
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

  locateSuccess: null,
  deleteRequest: [],
  deleteSuccess: [],
}

export default eventHandlers
