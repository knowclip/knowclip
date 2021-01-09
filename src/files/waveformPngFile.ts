import r from '../redux'
import { FileEventHandlers } from './eventHandlers'

export default {
  openRequest: async (file, filePath, _state, _effects) => {
    return [await r.openFileSuccess(file, filePath)]
  },
  openSuccess: [],
  locateRequest: async (file, _availability, _message, state, effects) => {
    try {
      const parentFile = r.getFileAvailabilityById(
        state,
        'MediaFile',
        file.parentId
      )
      if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED') {
        return [
          r.openFileFailure(
            file,
            null,
            `Parent media file has not been loaded.`
          ),
        ]
      }

      const path = parentFile.filePath
      if (!path) return []

      const pngPath = await effects.getWaveformPng(state, file, path)
      if (pngPath.errors)
        return [
          r.openFileFailure(
            file,
            null,
            'Could not locate file: ' +
              (pngPath.errors.join('; ') || 'problem generating waveform.')
          ),
        ]

      return [r.locateFileSuccess(file, pngPath.value)]
    } catch (err) {
      return [
        r.openFileFailure(
          file,
          null,
          'Problem making waveform image: ' + (err.message || err.toString())
        ),
      ]
    }
  },
  locateSuccess: null,
  deleteRequest: [
    async (_file, availability, descendants, _state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [],
} as FileEventHandlers<WaveformPng>
