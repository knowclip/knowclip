import * as r from '../redux'
import { FileEventHandlers } from './eventHandlers'

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    return [await r.openFileSuccess(file, filePath)]
  },
  openSuccess: [],
  locateRequest: async ({ file }, availability, state, effects) => {
    try {
      const parentFile = r.getFileAvailabilityById(state, 'MediaFile', file.id)
      if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
        return [r.openFileFailure(file, null, null)]

      const cbr = r.getConstantBitrateFilePath(state, parentFile.id)
      if (!cbr) return []

      const pngPath = await effects.getWaveformPng(state, file, cbr)
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
    async (file, availability, descendants, state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [],
} as FileEventHandlers<WaveformPng>
