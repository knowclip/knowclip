import * as r from '../redux'
import { newExternalSubtitlesTrack } from '../utils/subtitles'
import { FileEventHandlers } from './eventHandlers'
import { extname } from 'path'

const isVtt = (filePath: FilePath) => extname(filePath) === '.vtt'

export default {
  openRequest: async ({ file }, filePath, state, effects) => [
    r.openFileSuccess(file, filePath),
  ],

  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      if (isVtt(filePath)) {
        const chunks = await effects.getSubtitlesFromFile(state, filePath)
        return [
          r.addSubtitlesTrack(
            newExternalSubtitlesTrack(
              validatedFile.id,
              validatedFile.parentId,
              chunks,
              filePath,
              filePath
            )
          ),
        ]
      } else {
        const vttFile = r.getFile(
          state,
          'VttConvertedSubtitlesFile',
          validatedFile.id
        )
        return [
          r.openFileRequest(
            vttFile || {
              type: 'VttConvertedSubtitlesFile',
              id: validatedFile.id,
              parentId: validatedFile.id, // not needed?
              parentType: 'ExternalSubtitlesFile',
            }
          ),
        ]
      }
    },
  ],

  locateRequest: async ({ file, message }, state, effects) => {
    return [r.fileSelectionDialog(message, file)]
  },

  locateSuccess: null,

  deleteRequest: [
    async (file, descendants, state, effects) => [
      r.deleteFileSuccess(file, descendants),
    ],
  ],

  deleteSuccess: [
    async ({ file }, state, effects) => {
      const mediaFile = r.getFile(state, 'MediaFile', file.parentId)
      return mediaFile
        ? [r.deleteSubtitlesTrackFromMedia(file.id, file.parentId)]
        : []
    },
  ],
} as FileEventHandlers<ExternalSubtitlesFile>
