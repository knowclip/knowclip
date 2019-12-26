import * as r from '../redux'
import { basename } from 'path'
import uuid from 'uuid'
import { FileEventHandlers, OpenFileSuccessHandler } from './eventHandlers'
import { readMediaFile } from '../utils/ffmpeg'

const streamIndexMatchesExistingTrack = (
  vttFile: VttConvertedSubtitlesFile,
  streamIndex: number
) => vttFile.parentType === 'MediaFile' && vttFile.streamIndex === streamIndex

const addEmbeddedSubtitlesFiles: OpenFileSuccessHandler<MediaFile> = async (
  {
    validatedFile: {
      subtitlesTracksStreamIndexes,
      id,
      subtitles: existingSubtitlesIds,
    },
    filePath,
  },
  state,
  effects
) =>
  // TODO: clean up orphans?
  subtitlesTracksStreamIndexes
    .filter(
      streamIndex =>
        !existingSubtitlesIds.some(id =>
          streamIndexMatchesExistingTrack(
            state.files.VttConvertedSubtitlesFile[id],
            streamIndex
          )
        )
    )
    .map(
      streamIndex =>
        r.addAndOpenFile({
          type: 'VttConvertedSubtitlesFile',
          parentId: id,
          id: uuid(),
          streamIndex,
          parentType: 'MediaFile',
        })
      // or load existing
    )
const reloadRememberedSubtitles: OpenFileSuccessHandler<MediaFile> = async (
  { validatedFile: { subtitles: existingSubtitlesIds }, filePath },
  state,
  effects
) =>
  existingSubtitlesIds.map(id => {
    const externalSubtitles = r.getFile(state, 'ExternalSubtitlesFile', id)
    if (externalSubtitles) return r.openFileRequest(externalSubtitles)

    const embeddedSubtitles = r.getFile(state, 'VttConvertedSubtitlesFile', id)
    if (embeddedSubtitles) return r.openFileRequest(embeddedSubtitles)

    return ({ type: 'whoops couldnt find file' } as unknown) as Action
  })
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
        }),
      ]
    : []

const setDefaultTags: OpenFileSuccessHandler<MediaFile> = async (
  action,
  state,
  effects
) => {
  const currentFileName = r.getCurrentFileName(state)
  return [r.setDefaultTags(currentFileName ? [basename(currentFileName)] : [])]
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
    addEmbeddedSubtitlesFiles,
    reloadRememberedSubtitles,
    getCbr,
    getWaveform,
    setDefaultTags,
  ],
  locateRequest: async (action, state, effects) => {
    return [r.fileSelectionDialog(action.message, action.file)]
  },
  locateSuccess: null,
  deleteRequest: null,
  deleteSuccess: null,
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
