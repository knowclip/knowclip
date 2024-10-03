import r from '../redux'
import { newExternalSubtitlesTrack } from '../utils/newSubtitlesTrack'
import { FileEventHandlers } from './eventHandlers'
import { extname } from '../utils/rendererPathHelpers'
import type { ElectronApi } from '../preload'
import { sanitizeSubtitles } from './sanitizeSubtitles'
import { handleSubtitlesValidationResult } from '../utils/handleSubtitlesValidationResult'

const isVtt = (platform: ElectronApi['platform'], filePath: FilePath) =>
  extname(platform, filePath).toLowerCase() === '.vtt'

const externalSubtitlesFileEventHandlers: FileEventHandlers<ExternalSubtitlesFile> =
  {
    openRequest: async (file, filePath, state, effects) => {
      const result = await effects.validateSubtitleFileBeforeOpen(
        filePath,
        file
      )
      return [handleSubtitlesValidationResult(effects, file, filePath, result)]
    },
    openSuccess: [
      async (validatedFile, filePath, state, effects) => {
        const { platform } = window.electronApi
        if (isVtt(platform, filePath)) {
          const chunksResult = await effects.getSubtitlesFromFile(
            filePath,
            '.vtt'
          )

          if (chunksResult.error) {
            return [
              r.simpleMessageSnackbar(
                `There was a problem reading subtitles from ${validatedFile.name}: ${chunksResult.error.message}`
              ),
            ]
          }
          const chunks = sanitizeSubtitles(chunksResult.value)

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
                  ...(state.dialog.queue.some(
                    (d) => d.type === 'SubtitlesClips'
                  )
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
  }

export default externalSubtitlesFileEventHandlers
