import r from '../redux'
import { FileEventHandlers, OpenFileSuccessHandler } from './eventHandlers'
import { basename, dirname, join } from '../utils/rendererPathHelpers'
import { getHumanFileName } from '../utils/files'
import { formatDurationWithMilliseconds } from '../utils/formatTime'
import moment from 'moment'
import { failure } from '../utils/result'
import { FfprobeData } from 'fluent-ffmpeg'
import { getMediaCompatibilityWarnings } from '../node/getMediaCompatibilityIssues'
import { FileUpdateName } from './FileUpdateName'

const handlers = (): FileEventHandlers<MediaFile> => ({
  openRequest: async (file, filePath, _state, effects) => {
    effects.pauseMedia()
    const validationResult = await validateMediaFile(file, filePath, effects)
    if (validationResult.error) {
      return [
        r.openFileFailure(
          file,
          filePath,
          `Problem opening ${getHumanFileName(file)}: ${
            validationResult.error.message || 'problem reading file.'
          }`
        ),
      ]
    }

    const {
      differences: differencesMessage,
      compatibilityWarnings: compatibilityWarnings,
      file: validatedFile,
    } = validationResult.value
    if (differencesMessage) {
      return [
        r.setMediaMetadata(validationResult.value.metadata),
        r.confirmationDialog(
          differencesMessage,
          compatibilityWarnings.length
            ? r.mediaConversionConfirmationDialog(
                `This media file is not compatible with Knowclip in its raw state for the following reason(s):\n\n${compatibilityWarnings.join(
                  '\n'
                )}\n\nKnowclip will try some special processing to make this file work, which might slow things down a bit. Would you like to proceed anyway?`,
                r.openFileSuccess(
                  validatedFile,
                  filePath,
                  effects.nowUtcTimestamp()
                ),
                r.openFileFailure(
                  file,
                  filePath,
                  `Some features may be unavailable until your file is located.`
                ),
                true
              )
            : r.openFileSuccess(
                validatedFile,
                filePath,
                effects.nowUtcTimestamp()
              ),
          r.openFileFailure(
            file,
            filePath,
            `Some features may be unavailable until your file is located.`
          ),
          true
        ),
      ]
    }

    // TODO: make sure the setting is checked TRUE unless the user has unchecked it.
    // TODO: maybe show a snackbar if the dialog is not shown

    if (compatibilityWarnings.length) {
      // TODO: also check if settings checkbox is checked, also above
      return [
        r.setMediaMetadata(validationResult.value.metadata),
        r.mediaConversionConfirmationDialog(
          `This media file is not compatible with Knowclip in its raw state for the following reason(s):\n\n${compatibilityWarnings.join(
            '\n'
          )}\n\nKnowclip will try some special processing to make this file work, which might slow things down a bit. Would you like to proceed anyway?`,
          r.openFileSuccess(validatedFile, filePath, effects.nowUtcTimestamp()),
          r.openFileFailure(
            file,
            filePath,
            `Some features may be unavailable until your file is located.`
          ),
          true
        ),
      ]
    }

    return [
      r.setMediaMetadata(validationResult.value.metadata),
      r.openFileSuccess(validatedFile, filePath, effects.nowUtcTimestamp()),
    ]
  },

  openSuccess: [
    addEmbeddedSubtitles,
    loadExternalSubtitles,
    autoAddExternalSubtitles,
    // getCbr,
    getWaveform,
    setDefaultClipSpecs,
  ],
  locateRequest: async (file, availability, message, state, effects) => {
    const autoSearchDirectories = r.getAssetsDirectories(state)

    // works while fileavailability names can't be changed...
    for (const directory of autoSearchDirectories) {
      const { platform } = window.electronApi
      const nameMatch = join(
        platform,
        directory,
        basename(platform, availability.name)
      )
      const matchingFile = (await effects.fileExists(nameMatch)).value
        ? await validateMediaFile(file, nameMatch, effects)
        : null

      if (matchingFile && !matchingFile.error) {
        return [r.locateFileSuccess(file, nameMatch)]
      }
    }

    return [r.fileSelectionDialog(message, file)]
  },
  locateSuccess: null,
  deleteRequest: [
    async (_file, availability, descendants, _state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [],
})

export const validateMediaFile = async (
  existingFile: MediaFile,
  filePath: string,
  effects: EpicsDependencies
): AsyncResult<{
  file: MediaFile
  differences: string | null
  compatibilityWarnings: string[]
  metadata: FfprobeData
}> => {
  const readResult = await effects.readMediaFile(
    filePath,
    existingFile.id,
    existingFile.parentId,
    existingFile.subtitles,
    existingFile.flashcardFieldsToSubtitlesTracks
  )

  if (readResult.error) {
    return failure(readResult.error.message)
  }

  const {
    value: { file: newFile, ffprobeMetadata },
  } = readResult

  const differences: { [attribute: string]: [string, string] } = {}

  if (existingFile.name !== newFile.name) {
    differences.name = [existingFile.name, newFile.name]
  }
  if (existingFile.durationSeconds !== newFile.durationSeconds) {
    differences.duration = [
      formatDurationWithMilliseconds(
        moment.duration({ seconds: existingFile.durationSeconds })
      ),
      formatDurationWithMilliseconds(
        moment.duration({ seconds: newFile.durationSeconds })
      ),
    ]
  }
  if (existingFile.format !== newFile.format) {
    differences.format = [existingFile.format, newFile.format]
  }
  if (
    existingFile.subtitlesTracksStreamIndexes.sort().toString() !==
    newFile.subtitlesTracksStreamIndexes.sort().toString()
  ) {
    differences['subtitles streams'] = [
      existingFile.subtitlesTracksStreamIndexes.join(', '),
      newFile.subtitlesTracksStreamIndexes.join(', '),
    ]
  }

  return {
    value: {
      file: newFile,
      metadata: ffprobeMetadata,
      compatibilityWarnings: getMediaCompatibilityWarnings(ffprobeMetadata),
      differences: Object.keys(differences).length
        ? `This media file differs from the one on record by:\n\n ${Object.entries(
            differences
          )
            .map(
              ([attr, [old, current]]) =>
                `${attr}: "${current}" for this file instead of "${old}"`
            )
            .join('\n')}.'\n\nAre you sure this is the file you want to open?'`
        : null,
    },
  }
}

const SUBTITLES_FILE_EXTENSIONS: SubtitlesFileExtension[] = [
  'vtt',
  'ass',
  'srt',
]
const extensionRegex = new RegExp(
  `\\.(${SUBTITLES_FILE_EXTENSIONS.join('|')})$`
)
const autoAddExternalSubtitles: OpenFileSuccessHandler<MediaFile> = async (
  file,
  filePath,
  state,
  effects
) => {
  const { id, subtitles } = file
  const { platform } = window.electronApi

  const fileNameWithoutExtension = basename(platform, filePath).replace(
    /\..+$/,
    ''
  )
  const readdirResult = await effects.readdir(dirname(platform, filePath))
  if (readdirResult.error) {
    return []
  }

  const potentialSubtitlesFilenames = readdirResult.value.filter(
    (filename) =>
      filename.startsWith(`${fileNameWithoutExtension}.`) &&
      extensionRegex.test(filename)
  )

  const previouslyLoadedExternalSubtitlesFiles = subtitles
    .map((s) =>
      r.getFile<ExternalSubtitlesFile>(state, 'ExternalSubtitlesFile', s.id)
    )
    .filter((f): f is ExternalSubtitlesFile => Boolean(f))

  const notAlreadyAdded = potentialSubtitlesFilenames.filter((name) => {
    return !previouslyLoadedExternalSubtitlesFiles.some((s) => s.name === name)
  })

  return await Promise.all(
    notAlreadyAdded.map(async (newSubtitlesfileName) => {
      const file: ExternalSubtitlesFile = {
        id: await effects.uuid(),
        type: 'ExternalSubtitlesFile',
        name: newSubtitlesfileName,
        parentId: id,
        chunksMetadata: null,
      }
      const { platform } = window.electronApi

      const subtitlesfilePath = join(
        platform,
        dirname(platform, filePath),
        newSubtitlesfileName
      )
      return r.openFileRequest(file, subtitlesfilePath)
    })
  )
}

const addEmbeddedSubtitles: OpenFileSuccessHandler<MediaFile> = async (
  { subtitlesTracksStreamIndexes, id, subtitles },
  _filePath,
  state,
  effects
) =>
  // TODO: clean up orphans?
  subtitlesTracksStreamIndexes.map((streamIndex) => {
    const existing = subtitles.find((s) => {
      if (s.type !== 'EmbeddedSubtitlesTrack') return false

      const file = r.getSubtitlesSourceFile(state, s.id)
      return (
        file &&
        file.type === 'VttConvertedSubtitlesFile' &&
        file.parentType === 'MediaFile' &&
        file.streamIndex === streamIndex
      )
    })
    const file = existing
      ? r.getFile(state, 'VttConvertedSubtitlesFile', existing.id)
      : null
    return r.openFileRequest(
      file || {
        type: 'VttConvertedSubtitlesFile',
        parentId: id,
        // TODO: investigate separating setting current media file
        // and opening a media file?
        // this complexity is maybe a sign that we need
        // two different stages for the event of adding + selecting a media file
        id: existing ? existing.id : effects.uuid(),
        streamIndex,
        parentType: 'MediaFile',
        chunksMetadata: null,
      }
    )
  })

const loadExternalSubtitles: OpenFileSuccessHandler<MediaFile> = async (
  { subtitles, id: mediaFileId },
  _filePath,
  state,
  effects
) => {
  return await Promise.all([
    ...subtitles
      .filter((s) => s.type === 'ExternalSubtitlesTrack')
      .map(async ({ id }) => {
        const externalSubtitles = r.getFile<ExternalSubtitlesFile>(
          state,
          'ExternalSubtitlesFile',
          id
        )
        const availability = r.getFileAvailabilityById(
          state,
          'ExternalSubtitlesFile',
          id
        )
        const file: ExternalSubtitlesFile = externalSubtitles || {
          id,
          type: 'ExternalSubtitlesFile',
          name: availability.name,
          parentId: mediaFileId,
          chunksMetadata: null,
        }

        const newlyAutoFoundSubtitlesPaths: {
          [id: string]:
            | { singleMatch: string }
            | { multipleMatches: true; singleMatch: undefined }
            | undefined
        } = {}
        const { platform } = window.electronApi

        for (const directory of r.getAssetsDirectories(state)) {
          const nameMatch = join(
            platform,
            directory,
            basename(platform, file.name)
          )
          const matchingFileExistsResult = await effects.fileExists(nameMatch)
          if (matchingFileExistsResult.error) {
            return r.simpleMessageSnackbar(
              `Problem loading subtitles from ${file.name}: ${matchingFileExistsResult.error.message}`
            )
          }
          const matchingFileExists = matchingFileExistsResult.value
          const validationResult = matchingFileExists
            ? await effects.validateSubtitlesFromFilePath(nameMatch, file)
            : null

          if (
            !validationResult?.error &&
            !validationResult?.value.value?.differences?.length
          ) {
            newlyAutoFoundSubtitlesPaths[file.id] =
              newlyAutoFoundSubtitlesPaths[file.id]
                ? { multipleMatches: true, singleMatch: undefined }
                : { singleMatch: nameMatch }
          }
        }

        const match = newlyAutoFoundSubtitlesPaths[file.id]
        const filePath = match && match.singleMatch
        return r.openFileRequest(file, filePath)
      }),
  ])
}
const getWaveform: OpenFileSuccessHandler<MediaFile> = async (
  validatedFile,
  filePath,
  _state,
  effects
) => {
  const waveformPngsResult = await effects.getWaveformPngs(validatedFile)
  if (waveformPngsResult.error) {
    return []
  }
  return [r.generateWaveformImages(waveformPngsResult.value)]
}

const setDefaultClipSpecs: OpenFileSuccessHandler<MediaFile> = async (
  validatedFile,
  _filePath,
  state,
  _effects
) => {
  const currentFileName = r.getCurrentFileName(state)
  const currentFileId = r.getCurrentFileId(state)
  const clipsCount = currentFileId
    ? r.getClipIdsByMediaFileId(state, currentFileId).length
    : 0

  if (currentFileName && !clipsCount) {
    const { platform } = window.electronApi

    return [
      r.setDefaultClipSpecs({
        tags: [basename(platform, currentFileName).replace(/\s/g, '_')],
        includeStill: validatedFile.isVideo,
      }),
    ]
  }

  const commonTags = currentFileId
    ? r.getFlashcards(state, currentFileId).reduce((tags, flashcard, i) => {
        if (i === 0) return flashcard.tags

        const tagsToDelete = []
        for (const tag of tags) {
          if (!flashcard.tags.includes(tag)) tagsToDelete.push(tag)
        }

        for (const tagToDelete of tagsToDelete) {
          const index = tags.indexOf(tagToDelete)
          tags.splice(index, 1)
        }
        return tags
      }, [] as string[])
    : []
  if (commonTags.length) return [r.setDefaultClipSpecs({ tags: commonTags })]

  return [r.setDefaultClipSpecs({ tags: [] })]
}

export default handlers()

export const updates = {
  [FileUpdateName.AddSubtitlesTrack]: (
    file,
    track: SubtitlesTrack
  ): MediaFile => {
    return {
      ...file,
      subtitles: file.subtitles.some((s) => s.id === track.id) // should not happen... but just in case
        ? file.subtitles
        : [
            ...file.subtitles,
            track.type === 'EmbeddedSubtitlesTrack'
              ? {
                  type: 'EmbeddedSubtitlesTrack',
                  id: track.id,
                }
              : { type: 'ExternalSubtitlesTrack', id: track.id },
          ],
    }
  },
  [FileUpdateName.DeleteSubtitlesTrack]: (
    file,
    trackId: SubtitlesTrackId
  ): MediaFile => ({
    ...file,
    subtitles: file.subtitles.filter(({ id }) => id !== trackId),
    flashcardFieldsToSubtitlesTracks: Object.entries(
      file.flashcardFieldsToSubtitlesTracks
    )
      .filter(([_fieldName, givenTrackId]) => trackId !== givenTrackId)
      .reduce((all, [fieldName, id]) => {
        all[fieldName as TransliterationFlashcardFieldName] = id
        return all
      }, {} as Partial<Record<TransliterationFlashcardFieldName, string>>),
  }),
  [FileUpdateName.LinkFlashcardFieldToSubtitlesTrack]: (
    file,
    flashcardFieldName: FlashcardFieldName,
    subtitlesTrackId: SubtitlesTrackId | null,
    _fieldToClear: FlashcardFieldName | null // TODO: check if needed
  ): MediaFile => {
    const flashcardFieldsToSubtitlesTracks = {
      ...file.flashcardFieldsToSubtitlesTracks,
    }
    if (subtitlesTrackId) {
      for (const [fieldName, trackId] of Object.entries(
        flashcardFieldsToSubtitlesTracks
      )) {
        if (trackId === subtitlesTrackId)
          delete flashcardFieldsToSubtitlesTracks[
            fieldName as TransliterationFlashcardFieldName
          ]
      }

      flashcardFieldsToSubtitlesTracks[flashcardFieldName] = subtitlesTrackId
    } else {
      delete flashcardFieldsToSubtitlesTracks[flashcardFieldName]
    }

    return {
      ...file,
      flashcardFieldsToSubtitlesTracks,
    }
  },
} satisfies FileUpdatesForFileType<MediaFile>
