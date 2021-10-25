import r from '../redux'
import { basename, dirname, join } from 'path'
import { FileEventHandlers, OpenFileSuccessHandler } from './eventHandlers'
import { readMediaFile } from '../utils/ffmpeg'
import { uuid } from '../utils/sideEffects'
import { getHumanFileName } from '../utils/files'
import { formatDurationWithMilliseconds } from '../utils/formatTime'
import moment from 'moment'
import { existsSync, readdir } from 'fs-extra'
import { getWaveformPngs } from '../utils/getWaveform'
import { validateSubtitlesFromFilePath } from '../utils/subtitles'
import { updaterGetter } from './updaterGetter'

const updater = updaterGetter<MediaFile>()

const handlers = (): FileEventHandlers<MediaFile> => ({
  openRequest: async (file, filePath, _state, effects) => {
    effects.pauseMedia()
    // mediaPlayer.src = ''

    const validationResult = await validateMediaFile(file, filePath)
    if (validationResult.errors) {
      return [
        r.openFileFailure(
          file,
          filePath,
          `Problem opening ${getHumanFileName(file)}: ${
            validationResult.errors.join(', ') || 'problem reading file.'
          }`
        ),
      ]
    }
    const [errorMessage, validatedFile] = validationResult.value
    if (errorMessage) {
      return [
        r.confirmationDialog(
          errorMessage + '\n\nAre you sure this is the file you want to open?',
          r.openFileSuccess(validatedFile, filePath),
          r.openFileFailure(
            file,
            filePath,
            `Some features may be unavailable until your file is located.`
          ),
          true
        ),
      ]
    }

    return [r.openFileSuccess(validatedFile, filePath)]
  },

  openSuccess: [
    addEmbeddedSubtitles,
    loadExternalSubtitles,
    autoAddExternalSubtitles,
    getCbr,
    getWaveform,
    setDefaultClipSpecs,
  ],
  locateRequest: async (file, availability, message, state, _effects) => {
    const autoSearchDirectories = r.getAssetsDirectories(state)

    // works while fileavailability names can't be changed...
    for (const directory of autoSearchDirectories) {
      const nameMatch = join(directory, basename(availability.name))
      const matchingFile = existsSync(nameMatch)
        ? await validateMediaFile(file, nameMatch)
        : null

      if (matchingFile && !matchingFile.errors) {
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
  filePath: string
): AsyncResult<[string | null, MediaFile]> => {
  const result = await readMediaFile(
    filePath,
    existingFile.id,
    existingFile.parentId,
    existingFile.subtitles,
    existingFile.flashcardFieldsToSubtitlesTracks
  )

  if (result.errors) return result

  const { value: newFile } = result

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

  if (Object.keys(differences).length) {
    return {
      value: [
        `This media file differs from the one on record by:\n\n ${Object.entries(
          differences
        )
          .map(
            ([attr, [old, current]]) =>
              `${attr}: "${current}" for this file instead of "${old}"`
          )
          .join('\n')}.`,
        newFile,
      ],
    }
  }

  return { value: [null, newFile] }
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
  { id, subtitles },
  filePath,
  state,
  effects
) => {
  const fileNameWithoutExtension = basename(filePath).replace(/\..+$/, '')
  const potentialSubtitlesFilenames = (await readdir(dirname(filePath))).filter(
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

  return notAlreadyAdded.map((newSubtitlesfileName) => {
    const file: ExternalSubtitlesFile = {
      id: effects.uuid(),
      type: 'ExternalSubtitlesFile',
      name: newSubtitlesfileName,
      parentId: id,
      chunksMetadata: null,
    }

    const subtitlesfilePath = join(dirname(filePath), newSubtitlesfileName)
    return r.openFileRequest(file, subtitlesfilePath)
  })
}

const addEmbeddedSubtitles: OpenFileSuccessHandler<MediaFile> = async (
  { subtitlesTracksStreamIndexes, id, subtitles },
  _filePath,
  state,
  _effects
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
        id: existing ? existing.id : uuid(),
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
  _effects
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
        for (const directory of r.getAssetsDirectories(state)) {
          const nameMatch = join(directory, basename(file.name))
          const matchingFile = existsSync(nameMatch)
            ? await validateSubtitlesFromFilePath(state, nameMatch, file)
            : null

          if (matchingFile && matchingFile.valid) {
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
  _filePath,
  _state,
  _effects
) => {
  return [r.generateWaveformImages(getWaveformPngs(validatedFile))]
}

const getCbr: OpenFileSuccessHandler<MediaFile> = async (
  validatedFile,
  _filePath,
  state,
  _effects
) => {
  if (validatedFile.format.toLowerCase().includes('mp3')) {
    const cbr = r.getFile(state, 'ConstantBitrateMp3', validatedFile.id)
    return [
      r.openFileRequest(
        cbr || {
          type: 'ConstantBitrateMp3',
          id: validatedFile.id,
          parentId: validatedFile.id,
        }
      ),
    ]
  }

  return []
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
    return [
      r.setDefaultClipSpecs({
        tags: [basename(currentFileName).replace(/\s/g, '_')],
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
  addSubtitlesTrack: updater((file: MediaFile, track: SubtitlesTrack) => {
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
  }),
  deleteSubtitlesTrack: updater(
    (file: MediaFile, trackId: SubtitlesTrackId) => ({
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
    })
  ),
  linkFlashcardFieldToSubtitlesTrack: updater(
    (
      file: MediaFile,
      flashcardFieldName: FlashcardFieldName,
      subtitlesTrackId: SubtitlesTrackId | null,
      _fieldToClear: FlashcardFieldName | null // TODO: check if needed
    ) => {
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
    }
  ),
}
