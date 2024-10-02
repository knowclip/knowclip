import r from '../redux'
import { FileEventHandlers } from './eventHandlers'

const waveformPngFileEventHandlers: FileEventHandlers<WaveformPng> = {
  openRequest: async (file, filePath, _state, effects) => {
    return [await r.openFileSuccess(file, filePath, effects.nowUtcTimestamp())]
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

      const fileAvailability = r.getFileAvailabilityById(
        state,
        'WaveformPng',
        file.id
      )
      const pngPath = await effects.getWaveformPng(fileAvailability, file, path)
      if (pngPath.error)
        return [
          r.openFileFailure(
            file,
            null,
            'Could not locate file: ' +
              (pngPath.error.message || 'problem generating waveform.')
          ),
        ]

      return [r.locateFileSuccess(file, pngPath.value)]
    } catch (err) {
      return [
        r.openFileFailure(file, null, `Problem making waveform image: ${err}`),
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
}

export default waveformPngFileEventHandlers
