import r from '../redux'
import {
  newExternalSubtitlesTrack,
  newEmbeddedSubtitlesTrack,
  validateBeforeOpenFileAction,
} from '../utils/subtitles'
import { FileEventHandlers } from './eventHandlers'

export default {
  openRequest: async (file, filePath, state, effects) => {
    const parentFile = r.getFileAvailabilityById(
      state,
      file.parentType,
      file.parentId
    )
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return [await r.openFileFailure(file, null, null)]

    const vttFilePath = await effects.getSubtitlesFilePath(
      state,
      parentFile.filePath,
      file
    )

    return await validateBeforeOpenFileAction(state, vttFilePath, file)
  },
  openSuccess: [
    async (validatedFile, filePath, state, effects) => {
      const source = r.getFileAvailabilityById(
        state,
        validatedFile.parentType,
        validatedFile.parentId
      )
      const sourceFile = r.getSubtitlesSourceFile(state, validatedFile.id)

      if (!(source && source.filePath && sourceFile)) return []

      const chunks = await effects.getSubtitlesFromFile(state, filePath)

      if (validatedFile.parentType === 'MediaFile') {
        if (r.getCurrentFileId(state) !== source.id) return []

        const mediaFile = r.getFile<MediaFile>(
          state,
          'MediaFile',
          validatedFile.parentId
        )

        if ('error' in chunks) {
          return [
            r.simpleMessageSnackbar(
              `There was a problem reading subtitles from ${
                mediaFile ? mediaFile.name : 'media file'
              }: ${chunks.error}`
            ),
          ]
        }

        const track = newEmbeddedSubtitlesTrack(validatedFile.id, chunks)

        return [
          ...(mediaFile && !mediaFile.subtitles.some((s) => s.id === track.id)
            ? [
                r.addSubtitlesTrack(track, mediaFile.id),
                r.linkSubtitlesDialog(validatedFile, chunks, mediaFile.id, true),
              ]
            : []),
          r.mountSubtitlesTrack(track),
        ]
      }

      const external = r.getFile(
        state,
        'ExternalSubtitlesFile',
        validatedFile.parentId
      ) as ExternalSubtitlesFile
      if ('error' in chunks) {
        return [
          r.simpleMessageSnackbar(
            `There was a problem reading subtitles from ${
              external ? external.name : 'media file'
            }: ${chunks.error}`
          ),
        ]
      }
      const track = newExternalSubtitlesTrack(validatedFile.id, chunks)
      const mediaFile = r.getFile<MediaFile>(
        state,
        'MediaFile',
        external.parentId
      )
      if (!mediaFile || r.getCurrentFileId(state) !== mediaFile.id) return []

      return [
        ...(mediaFile && !mediaFile.subtitles.some((s) => s.id === track.id)
          ? [
              r.addSubtitlesTrack(track, mediaFile.id),
              ...(state.dialog.queue.some((d) => d.type === 'SubtitlesClips')
                ? []
                : [r.linkSubtitlesDialog(external, chunks, mediaFile.id, true)]), // TODO: extract and share between here and externalSubtitlesFile.ts
            ]
          : []),
        r.mountSubtitlesTrack(track),
      ]
    },
  ],

  locateRequest: async (file, availability, message, state, effects) => {
    try {
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
            const tmpFilePath = await effects.getSubtitlesFilePath(
              state,
              source.filePath,
              file
            )
            return await validateBeforeOpenFileAction(state, tmpFilePath, file)
          }
          case 'ExternalSubtitlesFile':
            const tmpFilePath = await effects.getSubtitlesFilePath(
              state,
              source.filePath,
              file
            )
            return await validateBeforeOpenFileAction(state, tmpFilePath, file)
        }
      }
    } catch (err) {
      return [r.openFileFailure(file, null, err.message)]
    }
  },

  locateSuccess: null,
  deleteRequest: [
    async (file, availability, descendants, _state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [],
} as FileEventHandlers<VttConvertedSubtitlesFile>
