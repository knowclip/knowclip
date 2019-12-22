import { of, merge, empty } from 'rxjs'
import * as r from '../redux'
import { from } from 'rxjs'
import { basename } from 'path'
import uuid from 'uuid'
import { FileEventHandlers } from './eventHandlers'
import { readMediaFileRecord } from '../utils/ffmpeg'

const streamIndexMatchesExistingTrack = (
  vttFileRecord: TemporaryVttFileRecord,
  streamIndex: number
) =>
  vttFileRecord.parentType === 'MediaFile' &&
  vttFileRecord.streamIndex === streamIndex

export default {
  loadRequest: async (fileRecord, filePath, state, effects) => {
    effects.pauseMedia()
    // mediaPlayer.src = ''

    const [errorMessage, validatedFileRecord] = await validateMediaFile(
      fileRecord,
      filePath
    )
    return [
      errorMessage
        ? r.confirmationDialog(
            errorMessage +
              '\n\nAre you sure this is the file you want to open?',
            r.loadFileSuccess(validatedFileRecord, filePath),
            r.loadFileFailure(
              fileRecord,
              filePath,
              `File was rejected: ${filePath}`
            )
          )
        : r.loadFileSuccess(validatedFileRecord, filePath),
    ]
  },

  loadSuccess: (fileRecord, filePath, state, effects) => {
    const {
      subtitlesTracksStreamIndexes,
      id,
      subtitles: existingSubtitlesIds,
    } = fileRecord
    const addEmbeddedSubtitlesFiles = from(
      // TODO: clean up orphans?
      subtitlesTracksStreamIndexes
        .filter(
          streamIndex =>
            !existingSubtitlesIds.some(id =>
              streamIndexMatchesExistingTrack(
                state.fileRecords.TemporaryVttFile[id],
                streamIndex
              )
            )
        )
        .map(streamIndex => {
          return r.addAndLoadFile({
            type: 'TemporaryVttFile',
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
        const externalSubtitles = r.getFileRecord(
          state,
          'ExternalSubtitlesFile',
          id
        )
        if (externalSubtitles) return r.loadFileRequest(externalSubtitles)

        const embeddedSubtitles = r.getFileRecord(state, 'TemporaryVttFile', id)
        if (embeddedSubtitles) return r.loadFileRequest(embeddedSubtitles)

        return ({ type: 'whoops couldnt find file' } as unknown) as Action
      })
    )
    const getWaveform = of(
      r.addAndLoadFile({
        type: 'WaveformPng',
        parentId: fileRecord.id,
        id: fileRecord.id,
      })
    )
    const fileName = r.getCurrentFileName(state)
    const getCbr = fileRecord.format.toLowerCase().includes('mp3')
      ? from([
          r.simpleMessageSnackbar(
            'Converting mp3 to a usable format. Please be patient!'
          ),
          r.addAndLoadFile({
            type: 'ConstantBitrateMp3',
            id: fileRecord.id,
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
    return [r.fileSelectionDialog(action.message, action.fileRecord)]
  },

  loadFailure: null,
  locateSuccess: null,
} as FileEventHandlers<MediaFileRecord>

const validateMediaFile = async (
  existingFileRecord: MediaFileRecord,
  filePath: string
): Promise<[string | null, MediaFileRecord]> => {
  const newFileRecord = await readMediaFileRecord(
    filePath,
    existingFileRecord.id,
    existingFileRecord.parentId,
    existingFileRecord.subtitles,
    existingFileRecord.flashcardFieldsToSubtitlesTracks
  )

  const differences = []

  if (existingFileRecord.name !== newFileRecord.name) differences.push('name')
  if (existingFileRecord.durationSeconds !== newFileRecord.durationSeconds)
    differences.push('duration')
  if (existingFileRecord.durationSeconds !== newFileRecord.durationSeconds)
    differences.push('format')
  if (
    existingFileRecord.subtitlesTracksStreamIndexes.sort().toString() !==
    newFileRecord.subtitlesTracksStreamIndexes.sort().toString()
  )
    differences.push('subtitles tracks')

  if (differences.length) {
    return [
      `This media file differs from the one on record by: ${differences.join(
        ', '
      )}.`,
      newFileRecord,
    ]
  }

  return [null, newFileRecord]
}
