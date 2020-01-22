import * as r from '../redux'
import { basename } from 'path'
import { FileEventHandlers, OpenFileSuccessHandler } from './eventHandlers'
import { readMediaFile } from '../utils/ffmpeg'
import { uuid } from '../utils/sideEffects'

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
    return r.addAndOpenFile({
      type: 'VttConvertedSubtitlesFile',
      parentId: id,
      id: existing ? existing.id : uuid(),
      streamIndex,
      parentType: 'MediaFile',
    })
  })

const reloadRememberedExternalSubtitles: OpenFileSuccessHandler<
  MediaFile
> = async (
  { validatedFile: { subtitles, name }, filePath },
  state,
  effects
) => [
  ...subtitles
    .filter(s => s.type === 'ExternalSubtitlesTrack')
    .map(({ id }) => {
      const externalSubtitles = r.getFile(state, 'ExternalSubtitlesFile', id)
      if (externalSubtitles) return r.openFileRequest(externalSubtitles)

      return r.simpleMessageSnackbar(
        'Could not open external subtitles for ' + name
      )
    }),
]
const getWaveform: OpenFileSuccessHandler<MediaFile> = async (
  { validatedFile, filePath },
  state,
  effects
) => [
  r.addAndOpenFile({
    type: 'WaveformPng',
    parentId: validatedFile.id,
    id: validatedFile.id,
  }),
]

const getCbr: OpenFileSuccessHandler<MediaFile> = async (
  { validatedFile },
  state,
  effects
) =>
  validatedFile.format.toLowerCase().includes('mp3')
    ? [
        r.simpleMessageSnackbar(
          'Converting mp3 to a usable format. Please be patient!'
        ),
        r.addAndOpenFile({
          type: 'ConstantBitrateMp3',
          id: validatedFile.id,
          parentId: validatedFile.id,
        }),
      ]
    : []

const setDefaultTags: OpenFileSuccessHandler<MediaFile> = async (
  action,
  state,
  effects
) => {
  const currentFileName = r.getCurrentFileName(state)
  const currentFileId = r.getCurrentFileId(state)
  const clipsCount = currentFileId
    ? r.getClipIdsByMediaFileId(state, currentFileId).length
    : 0
  return [
    r.setDefaultTags(
      currentFileName && !clipsCount ? [basename(currentFileName)] : []
    ),
  ]
}

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    effects.pauseMedia()
    // mediaPlayer.src = ''

    const [errorMessage, validatedFile] = await validateMediaFile(
      file,
      filePath
    )
    return [
      errorMessage
        ? r.confirmationDialog(
            errorMessage +
              '\n\nAre you sure this is the file you want to open?',
            r.openFileSuccess(validatedFile, filePath),
            r.openFileFailure(file, filePath, `File was rejected: ${filePath}`)
          )
        : r.openFileSuccess(validatedFile, filePath),
    ]
  },

  openSuccess: [
    addEmbeddedSubtitles,
    reloadRememberedExternalSubtitles,
    getCbr,
    getWaveform,
    setDefaultTags,
  ],
  locateRequest: async (action, state, effects) => {
    return [r.fileSelectionDialog(action.message, action.file)]
  },
  locateSuccess: null,
  deleteRequest: [
    async (file, descendants, state, effects) => [
      r.deleteFileSuccess(file, descendants),
    ],
  ],
  deleteSuccess: [],
} as FileEventHandlers<MediaFile>

const validateMediaFile = async (
  existingFile: MediaFile,
  filePath: string
): Promise<[string | null, MediaFile]> => {
  const newFile = await readMediaFile(
    filePath,
    existingFile.id,
    existingFile.parentId,
    existingFile.subtitles,
    existingFile.flashcardFieldsToSubtitlesTracks
  )

  const differences = []

  if (existingFile.name !== newFile.name) differences.push('name')
  if (existingFile.durationSeconds !== newFile.durationSeconds)
    differences.push('duration')
  if (existingFile.durationSeconds !== newFile.durationSeconds)
    differences.push('format')
  if (
    existingFile.subtitlesTracksStreamIndexes.sort().toString() !==
    newFile.subtitlesTracksStreamIndexes.sort().toString()
  )
    differences.push('subtitles tracks')

  if (differences.length) {
    return [
      `This media file differs from the one on record by: ${differences.join(
        ', '
      )}.`,
      newFile,
    ]
  }

  return [null, newFile]
}
