import r from '../redux'

import { FileEventHandlers } from './eventHandlers'

const eventHandlers: FileEventHandlers<ConstantBitrateMp3> = {
  openRequest: async (file, filePath, _state, effects) => {
    return [r.openFileSuccess(file, filePath, effects.nowUtcTimestamp())]
  },

  openSuccess: [
    async (_validatedFile, _filePath, _state, _effects) => {
      return []
    },
  ],

  locateRequest: async (file, _availability, _message, state, effects) => {
    const parentFile = r.getFileAvailabilityById(state, 'MediaFile', file.id)
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return await [r.openFileFailure(file, null, null)]

    const cbrFilePath = await effects.getConstantBitrateMediaPath(
      parentFile.filePath,
      null
    )
    if (cbrFilePath.error)
      return [
        r.openFileFailure(
          file,
          _availability.filePath,
          cbrFilePath.error.message
        ),
      ]

    return [r.locateFileSuccess(file, cbrFilePath.value)]
  },

  locateSuccess: null,
  deleteRequest: [],
  deleteSuccess: [],
}

export default eventHandlers
