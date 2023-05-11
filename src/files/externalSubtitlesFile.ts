import r from '../redux'
import {
  newExternalSubtitlesTrack,
  validateBeforeOpenFileAction,
} from '../utils/subtitles'
import { FileEventHandlers } from './eventHandlers'
import { extname } from '../preload/path'

const isVtt = (filePath: FilePath) => extname(filePath).toLowerCase() === '.vtt'

export default {
  openRequest: async (file, filePath, state, _effects) => {
    return await validateBeforeOpenFileAction(state, filePath, file)
  },
  openSuccess: [
    async (validatedFile, filePath, state, effects) => {
      if (isVtt(filePath)) {
        const chunks = await effects.getSubtitlesFromFile(state, filePath)

        if ('error' in chunks) {
          return [
            r.simpleMessageSnackbar(
              `There was a problem reading subtitles from ${validatedFile.name}: ${chunks.error}`
            ),
          ]
        }

        const track = newExternalSubtitlesTrack(validatedFile.id, chunks)
        const mediaFile = r.getFile<MediaFile>(
          state,
          'MediaFile',
          validatedFile.parentId
        )
        if (r.getCurrentFileId(state) !== validatedFile.parentId) return []

        return [
          ...(mediaFile && !mediaFile.subtitles.some((s) => s.id === track.id)
            ? [
                r.addSubtitlesTrack(track, mediaFile.id),
                ...(state.dialog.queue.some((d) => d.type === 'SubtitlesClips')
                  ? []
                  : [
                      r.linkSubtitlesDialog(
                        validatedFile,
                        chunks,
                        mediaFile.id,
                        true
                      ),
                    ]),
              ]
            : []),
          r.mountSubtitlesTrack(track), // maybe should only do this after linkSubtitlesDialog in case this is first time mounting,
        ]
      } else {
        if (validatedFile.parentId !== r.getCurrentFileId(state)) return []
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
              chunksMetadata: null,
            }
          ),
        ]
      }
    },
  ],

  locateRequest: async (file, _availability, message, _state, _effects) => {
    return [r.fileSelectionDialog(message, file)]
  },

  locateSuccess: null,

  deleteRequest: [
    async (_file, availability, descendants, _state, _effects) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],

  deleteSuccess: [
    async (action, state, _effects) => {
      const mediaFile = Object.values(state.files.MediaFile).find(
        (m) => m && m.subtitles.some(({ id }) => id === action.file.id)
      )
      return mediaFile
        ? [r.deleteSubtitlesTrackFromMedia(action.file.id, mediaFile.id)]
        : []
    },
  ],
} as FileEventHandlers<ExternalSubtitlesFile>
