import r from '../redux'
import { handleSubtitlesValidationResult } from '../utils/handleSubtitlesValidationResult'
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

    const currentMediaFile = r.getCurrentMediaFile(state)
    const mediaMetadata = r.getCurrentMediaFileMetadata(state)
    if (!(currentMediaFile && mediaMetadata)) {
      return [await r.openFileFailure(file, null, null)]
    }
    const vttFilePathResult = await effects.getSubtitlesFilePath(
      file.parentType === 'MediaFile'
        ? {
            type: 'VttFromEmbeddedSubtitles',
            sourceFilePath: parentFile.filePath,
            file,
            mediaMetadata,
          }
        : {
            type: 'VttFromExternalSubtitles',
            sourceFilePath: parentFile.filePath,
            file,
          }
    )

    if (vttFilePathResult.error) {
      return [
        await r.openFileFailure(file, null, vttFilePathResult.error.message),
      ]
    }
    console.log(
      `About to validate VTT generated subtitles from ${vttFilePathResult.value}`
    )
    const { value: vttFilePath } = vttFilePathResult
    const validateSubtitlesResult =
      await effects.validateSubtitleFileBeforeOpen(vttFilePath, file)
    console.log(
      `VTT generated subtitles validation result:`,
      validateSubtitlesResult
    )

    return [
      handleSubtitlesValidationResult(
        effects,
        file,
        vttFilePath,
        validateSubtitlesResult
      ),
    ]
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

      const chunksResult = await effects.getSubtitlesFromFile(filePath, '.vtt')

      if (validatedFile.parentType === 'MediaFile') {
        if (r.getCurrentFileId(state) !== source.id) return []

        const mediaFile = r.getFile<MediaFile>(
          state,
          'MediaFile',
          validatedFile.parentId
        )

        if (chunksResult.error) {
          return [
            r.simpleMessageSnackbar(
              `There was a problem reading subtitles from ${
                mediaFile ? mediaFile.name : 'media file'
              }: ${chunksResult.error.message}`
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
      if (chunksResult.error) {
        return [
          r.simpleMessageSnackbar(
            `There was a problem reading subtitles from ${
              external ? external.name : '[external subtitles file not found]'
            }: ${chunksResult.error?.message}`
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
            const mediaMetadata = r.getCurrentMediaFileMetadata(state)
            if (!mediaMetadata)
              return [r.openFileFailure(file, null, 'No media metadata found')]

            const tmpFilePath = await effects.getSubtitlesFilePath({
              type: 'VttFromEmbeddedSubtitles',
              sourceFilePath: source.filePath,
              file,
              mediaMetadata,
            })
            if (tmpFilePath.error) {
              return [
                r.openFileFailure(
                  file,
                  null,
                  `Error locating file "${
                    availability.filePath || availability.type
                  }: ${tmpFilePath.error.message}`
                ),
              ]
            }
            const validateResult = await effects.validateSubtitleFileBeforeOpen(
              tmpFilePath.value,
              file
            )
            return [
              handleSubtitlesValidationResult(
                effects,
                file,
                tmpFilePath.value,
                validateResult
              ),
            ]
          }
          case 'ExternalSubtitlesFile': {
            const tmpFilePath = await effects.getSubtitlesFilePath({
              type: 'VttFromExternalSubtitles',
              sourceFilePath: source.filePath,
              file: file,
            })
            if (tmpFilePath.error) {
              return [
                r.openFileFailure(
                  file,
                  null,
                  `Error locating file: ${tmpFilePath.error.message}`
                ),
              ]
            }
            const validateResult = await effects.validateSubtitleFileBeforeOpen(
              tmpFilePath.value,
              file
            )
            return [
              handleSubtitlesValidationResult(
                effects,
                file,
                tmpFilePath.value,
                validateResult
              ),
            ]
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
