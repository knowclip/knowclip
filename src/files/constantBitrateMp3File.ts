import r from '../redux'

import { FileEventHandlers } from './eventHandlers'

const eventHandlers: FileEventHandlers<ConstantBitrateMp3> = {
  openRequest: async (file, filePath, _state, _effects) => {
    return [r.openFileSuccess(file, filePath)]
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
    if (cbrFilePath.errors)
      return [
        r.openFileFailure(
          file,
          _availability.filePath,
          cbrFilePath.errors.join('; ')
        ),
      ]

    return [r.locateFileSuccess(file, cbrFilePath.value)]
  },

  locateSuccess: null,
  deleteRequest: [],
  deleteSuccess: [],
}

export default eventHandlers
