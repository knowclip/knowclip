import { of, merge, empty } from 'rxjs'
import * as r from '../redux'
import { from } from 'rxjs'
import { basename } from 'path'
import uuid from 'uuid'
import { FileEventHandlers } from './eventHandlers'
import { readMediaFile } from '../utils/ffmpeg'

const streamIndexMatchesExistingTrack = (
  vttFile: VttConvertedSubtitlesFile,
  streamIndex: number
) => vttFile.parentType === 'MediaFile' && vttFile.streamIndex === streamIndex

export default {
  openRequest: async (file, filePath, state, effects) => {
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

  openSuccess: (file, filePath, state, effects) => {
    const {
      subtitlesTracksStreamIndexes,
      id,
      subtitles: existingSubtitlesIds,
    } = file
    const addEmbeddedSubtitlesFiles = from(
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
        .map(streamIndex => {
          return r.addAndOpenFile({
            type: 'VttConvertedSubtitlesFile',
            parentId: id,
            id: uuid(),
            streamIndex,
            parentType: 'MediaFile',
          })
          // or load existing
        })
    )

    const reloadRememberedSubtitles = from(
      existingSubtitlesIds.map(id => {
        const externalSubtitles = r.getFile(state, 'ExternalSubtitlesFile', id)
        if (externalSubtitles) return r.openFileRequest(externalSubtitles)

        const embeddedSubtitles = r.getFile(
          state,
          'VttConvertedSubtitlesFile',
          id
        )
        if (embeddedSubtitles) return r.openFileRequest(embeddedSubtitles)

        return ({ type: 'whoops couldnt find file' } as unknown) as Action
      })
    )
    const getWaveform = of(
      r.addAndOpenFile({
        type: 'WaveformPng',
        parentId: file.id,
        id: file.id,
      })
    )
    const fileName = r.getCurrentFileName(state)
    const getCbr = file.format.toLowerCase().includes('mp3')
      ? from([
          r.simpleMessageSnackbar(
            'Converting mp3 to a usable format. Please be patient!'
          ),
          r.addAndOpenFile({
            type: 'ConstantBitrateMp3',
            id: file.id,
          }),
        ])
      : empty()

    return merge(
      addEmbeddedSubtitlesFiles,
      reloadRememberedSubtitles,
      getCbr,
      getWaveform,

      of(r.setDefaultTags(fileName ? [basename(fileName)] : []))
    )
  },
  locateRequest: async (action, state, effects) => {
    return [r.fileSelectionDialog(action.message, action.file)]
  },

  openFailure: null,
  locateSuccess: null,
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
