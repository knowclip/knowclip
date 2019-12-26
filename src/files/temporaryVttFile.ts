import * as r from '../redux'
import {
  newExternalSubtitlesTrack,
  newEmbeddedSubtitlesTrack,
} from '../utils/subtitles'
import { FileEventHandlers } from './eventHandlers'

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    const parentFile = r.getFileAvailabilityById(
      state,
      file.parentType,
      file.parentId
    )
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return [
        await r.openFileFailure(file, null, 'You must first locate this file.'),
      ]

    const vttFilePath = await effects.getSubtitlesFilePath(
      state,
      parentFile.filePath,
      file
    )

    return [r.openFileSuccess(file, vttFilePath)]
  },
  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      const sourceFile = r.getFileAvailabilityById(
        state,
        validatedFile.parentType,
        validatedFile.parentId
      ) as CurrentlyLoadedFile
      const chunks = await effects.getSubtitlesFromFile(state, filePath)
      if (validatedFile.parentType === 'MediaFile')
        return [
          r.addSubtitlesTrack(
            newEmbeddedSubtitlesTrack(
              validatedFile.id,
              validatedFile.parentId,
              chunks,
              validatedFile.streamIndex,
              filePath
            )
          ),
        ]

      const external = r.getFile(
        state,
        'ExternalSubtitlesFile',
        validatedFile.parentId
      ) as ExternalSubtitlesFile
      return [
        r.addSubtitlesTrack(
          newExternalSubtitlesTrack(
            validatedFile.id,
            external.parentId,
            chunks,
            sourceFile.filePath,
            filePath
          )
        ),
      ]
    },
  ],

  locateRequest: async ({ file }, state, effects) => {
    const source = r.getFileAvailabilityById(
      state,
      file.parentType,
      file.parentId
    )
    if (source && source.status === 'CURRENTLY_LOADED') {
      const sourceFile: MediaFile | ExternalSubtitlesFile | null = r.getFile(
        state,
        file.parentType,
        file.parentId
      )
      // TODO: investigate risk of infinite loop
      if (!sourceFile)
        return [r.simpleMessageSnackbar('No source subtitles file ')]

      switch (file.parentType) {
        case 'MediaFile': {
          return await Promise.all(
            (sourceFile as MediaFile).subtitlesTracksStreamIndexes.map(
              async streamIndex => {
                const tmpFilePath = await effects.getSubtitlesFilePath(
                  state,
                  source.filePath,
                  file
                )
                return r.locateFileSuccess(file, tmpFilePath)
              }
            )
          )
        }
        case 'ExternalSubtitlesFile':
          const tmpFilePath = await effects.getSubtitlesFilePath(
            state,
            source.filePath,
            file
          )
          return [r.locateFileSuccess(file, tmpFilePath)]
        default:
          //   delete file record, suggest retry?
          return [r.simpleMessageSnackbar('Whoops no valid boop source??')]

        // else
      }
    }
    return [r.simpleMessageSnackbar('Whoops no valid boop source??')]
  },

  locateSuccess: null,
  deleteRequest: [],
  deleteSuccess: null,
} as FileEventHandlers<VttConvertedSubtitlesFile>
