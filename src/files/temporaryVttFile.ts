import r from '../redux'
import { newEmbeddedSubtitlesTrack } from '../utils/newSubtitlesTrack'
import { newExternalSubtitlesTrack } from '../utils/newSubtitlesTrack'
import { FileEventHandlers } from './eventHandlers'
import { sanitizeSubtitles } from './sanitizeSubtitles'

const vttFileEventHandlers: FileEventHandlers<VttConvertedSubtitlesFile> = {
  openRequest: async (file, filePath, state, effects) => {
    const parentFile = r.getFileAvailabilityById(
      state,
      file.parentType,
      file.parentId
    )
    if (!parentFile || parentFile.status !== 'CURRENTLY_LOADED')
      return [await r.openFileFailure(file, null, null)]

    const vttFilePathResult = await effects.getSubtitlesFilePath(
      state,
      parentFile.filePath,
      file
    )
    if (vttFilePathResult.errors) {
      return [
        await r.openFileFailure(
          file,
          null,
          vttFilePathResult.errors.join('; ')
        ),
      ]
    }
    const validateSubtitlesResult =
      await effects.validateSubtitleFileBeforeOpen(
        state,
        vttFilePathResult.value,
        file
      )
    if (validateSubtitlesResult.errors) {
      return [
        await r.openFileFailure(
          file,
          null,
          validateSubtitlesResult.errors.join('; ')
        ),
      ]
    }
    return validateSubtitlesResult.value
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

      const chunksResult = await effects.getSubtitlesFromFile(state, filePath)

      if (validatedFile.parentType === 'MediaFile') {
        if (r.getCurrentFileId(state) !== source.id) return []

        const mediaFile = r.getFile<MediaFile>(
          state,
          'MediaFile',
          validatedFile.parentId
        )

        if (chunksResult.errors) {
          return [
            r.simpleMessageSnackbar(
              `There was a problem reading subtitles from ${
                mediaFile ? mediaFile.name : 'media file'
              }: ${chunksResult.errors.join('; ')}`
            ),
          ]
        }

        const chunks = sanitizeSubtitles(chunksResult.value)
        const track = newEmbeddedSubtitlesTrack(validatedFile.id, chunks)

        return [
          ...(mediaFile && !mediaFile.subtitles.some((s) => s.id === track.id)
            ? [
                r.addSubtitlesTrack(track, mediaFile.id),
                r.linkSubtitlesDialog(
                  validatedFile,
                  chunks,
                  mediaFile.id,
                  true
                ),
              ]
            : []),
          r.mountSubtitlesTrack(track),
        ]
      }

      const external = r.getFile<ExternalSubtitlesFile>(
        state,
        'ExternalSubtitlesFile',
        validatedFile.parentId
      )
      if (chunksResult.errors) {
        return [
          r.simpleMessageSnackbar(
            `There was a problem reading subtitles from ${
              external ? external.name : '[external subtitles file not found]'
            }: ${chunksResult.errors.join('; ')}`
          ),
        ]
      }
      if (!external) {
        console.error(
          `External subtitles file not found for converted VTT track ${validatedFile.id}`
        )
        return [r.openFileFailure(validatedFile, null, null)]
      }
      const chunks = sanitizeSubtitles(chunksResult.value)
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
                : [
                    r.linkSubtitlesDialog(external, chunks, mediaFile.id, true),
                  ]), // TODO: extract and share between here and externalSubtitlesFile.ts
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
            if (tmpFilePath.errors) {
              return [
                r.openFileFailure(file, null, tmpFilePath.errors.join('; ')),
              ]
            }
            const validateResult = await effects.validateSubtitleFileBeforeOpen(
              state,
              tmpFilePath.value,
              file
            )
            if (validateResult.errors) {
              return [
                r.openFileFailure(file, null, validateResult.errors.join('; ')),
              ]
            }
            return validateResult.value
          }
          case 'ExternalSubtitlesFile': {
            const tmpFilePath = await effects.getSubtitlesFilePath(
              state,
              source.filePath,
              file
            )
            if (tmpFilePath.errors) {
              return [
                r.openFileFailure(file, null, tmpFilePath.errors.join('; ')),
              ]
            }
            const validateResult = await effects.validateSubtitleFileBeforeOpen(
              state,
              tmpFilePath.value,
              file
            )
            if (validateResult.errors) {
              return [
                r.openFileFailure(file, null, validateResult.errors.join('; ')),
              ]
            }
            return validateResult.value
          }
        }
      }

      return []
    } catch (err) {
      return [r.openFileFailure(file, null, err ? String(err) : null)]
    }
  },

  locateSuccess: null,
  deleteRequest: [
    async (file, availability, descendants, _state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [],
}

export default vttFileEventHandlers
