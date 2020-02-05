import * as r from '../redux'
import { basename, join } from 'path'
import { FileEventHandlers, OpenFileSuccessHandler } from './eventHandlers'
import { readMediaFile, AsyncError } from '../utils/ffmpeg'
import { uuid } from '../utils/sideEffects'
import { getHumanFileName } from '../utils/files'
import { formatDurationWithMilliseconds } from '../utils/formatTime'
import moment from 'moment'
import { existsSync } from 'fs-extra'

const addEmbeddedSubtitles: OpenFileSuccessHandler<MediaFile> = async (
  { validatedFile: { subtitlesTracksStreamIndexes, id, subtitles }, filePath },
  state,
  effects
) =>
  // TODO: clean up orphans?
  subtitlesTracksStreamIndexes.map(streamIndex => {
    const existing = subtitles.find(
      s => s.type === 'EmbeddedSubtitlesTrack' && s.streamIndex === streamIndex
    )
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
      }
    )
  })

const loadExternalSubtitles: OpenFileSuccessHandler<MediaFile> = async (
  { validatedFile: { subtitles, name, id: mediaFileId }, filePath },
  state,
  effects
) => [
  ...subtitles
    .filter(s => s.type === 'ExternalSubtitlesTrack')
    .map(({ id }) => {
      const externalSubtitles = r.getFile(state, 'ExternalSubtitlesFile', id)
      const availability = r.getFileAvailabilityById(
        state,
        'ExternalSubtitlesFile',
        id
      )
      return r.openFileRequest(
        externalSubtitles || {
          id,
          type: 'ExternalSubtitlesFile',
          // name: 'PLACEHOLDERR',
          name: availability.name,
          parentId: mediaFileId,
        }
      )
    }),
]
const getWaveform: OpenFileSuccessHandler<MediaFile> = async (
  { validatedFile, filePath },
  state,
  effects
) => {
  const waveform = r.getFile(state, 'WaveformPng', validatedFile.id)
  return [
    r.openFileRequest(
      waveform || {
        type: 'WaveformPng',
        parentId: validatedFile.id,
        id: validatedFile.id,
      }
    ),
  ]
}

const getCbr: OpenFileSuccessHandler<MediaFile> = async (
  { validatedFile },
  state,
  effects
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
  action,
  state,
  effects
) => {
  const currentFileName = r.getCurrentFileName(state)
  const currentFileId = r.getCurrentFileId(state)
  const clipsCount = currentFileId
    ? r.getClipIdsByMediaFileId(state, currentFileId).length
    : 0

  if (currentFileName && !clipsCount)
    return [
      r.setDefaultClipSpecs({
        tags: [basename(currentFileName)],
        includeStill: action.validatedFile.isVideo,
      }),
    ]

  const commonTags = currentFileId
    ? r.getClips(state, currentFileId).reduce(
        (tags, clip, i) => {
          if (i === 0) return clip.flashcard.tags

          const tagsToDelete = []
          for (const tag of tags) {
            if (!clip.flashcard.tags.includes(tag)) tagsToDelete.push(tag)
          }

          for (const tagToDelete of tagsToDelete) {
            const index = tags.indexOf(tagToDelete)
            tags.splice(index, 1)
          }
          return tags
        },
        [] as string[]
      )
    : []
  if (commonTags.length) return [r.setDefaultClipSpecs({ tags: commonTags })]

  return [r.setDefaultClipSpecs({ tags: [] })]
}

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    effects.pauseMedia()
    // mediaPlayer.src = ''

    const validationResult = await validateMediaFile(file, filePath)
    if (validationResult instanceof AsyncError)
      return [
        r.openFileFailure(
          file,
          filePath,
          `Problem opening ${getHumanFileName(
            file
          )}: ${validationResult.message || 'problem reading file.'}`
        ),
      ]
    const [errorMessage, validatedFile] = validationResult
    if (errorMessage)
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

    return [r.openFileSuccess(validatedFile, filePath)]
  },

  openSuccess: [
    addEmbeddedSubtitles,
    loadExternalSubtitles,
    getCbr,
    getWaveform,
    setDefaultClipSpecs,
  ],
  locateRequest: async (action, availability, state, effects) => {
    const autoSearchDirectories = r.getAssetsDirectories(state)

    // works while fileavailability names can't be changed...
    for (const directory of autoSearchDirectories) {
      const nameMatch = join(directory, basename(availability.name))
      const matchingFile =
        existsSync(nameMatch) &&
        (await validateMediaFile(action.file, nameMatch))

      if (matchingFile && !(matchingFile instanceof AsyncError))
        return [r.locateFileSuccess(action.file, nameMatch)]
    }

    return [r.fileSelectionDialog(action.message, action.file)]
  },
  locateSuccess: null,
  deleteRequest: [
    async (file, availability, descendants, state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [],
} as FileEventHandlers<MediaFile>

export const validateMediaFile = async (
  existingFile: MediaFile,
  filePath: string
): Promise<[string | null, MediaFile] | AsyncError> => {
  const newFile = await readMediaFile(
    filePath,
    existingFile.id,
    existingFile.parentId,
    existingFile.subtitles,
    existingFile.flashcardFieldsToSubtitlesTracks
  )

  if (newFile instanceof AsyncError) return newFile

  const differences: { [attribute: string]: [string, string] } = {}

  if (existingFile.name !== newFile.name)
    differences.name = [existingFile.name, newFile.name]
  if (existingFile.durationSeconds !== newFile.durationSeconds)
    differences.duration = [
      formatDurationWithMilliseconds(
        moment.duration({ seconds: existingFile.durationSeconds })
      ),
      formatDurationWithMilliseconds(
        moment.duration({ seconds: newFile.durationSeconds })
      ),
    ]
  if (existingFile.format !== newFile.format)
    differences.format = [existingFile.format, newFile.format]
  if (
    existingFile.subtitlesTracksStreamIndexes.sort().toString() !==
    newFile.subtitlesTracksStreamIndexes.sort().toString()
  )
    differences['subtitles streams'] = [
      existingFile.subtitlesTracksStreamIndexes.join(', '),
      newFile.subtitlesTracksStreamIndexes.join(', '),
    ]

  if (Object.keys(differences).length) {
    return [
      `This media file differs from the one on record by:\n\n ${Object.entries(
        differences
      )
        .map(
          ([attr, [old, current]]) =>
            `${attr}: "${current}" for this file instead of "${old}"`
        )
        .join('\n')}.`,
      newFile,
    ]
  }

  return [null, newFile]
}
