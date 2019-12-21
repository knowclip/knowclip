import { of, merge, empty } from 'rxjs'
import * as r from '../redux'
import { from } from 'rxjs'
import { basename } from 'path'
import uuid from 'uuid'
import {
  LoadRequestHandler,
  LoadSuccessHandler,
  LocateRequestHandler,
  FileEventHandlers,
} from './eventHandlers'
import { readMediaFileRecord } from '../utils/ffmpeg'

const loadRequest: LoadRequestHandler<MediaFileRecord> = async (
  fileRecord,
  filePath,
  state,
  effects
) => {
  effects.pauseMedia()
  // mediaPlayer.src = ''

  const [errorMessage, validatedFileRecord] = await validateFile(fileRecord, filePath)
  return [
    errorMessage
      ? r.confirmationDialog(errorMessage + '\n\nAre you sure this is the file you want to open?', r.loadFileSuccess(validatedFileRecord, filePath), r.loadFileFailure(fileRecord, filePath, `File was rejected: ${filePath}`))
      : r.loadFileSuccess(validatedFileRecord, filePath)
  ]
}

const streamIndexMatchesExistingTrack = (
  vttFileRecord: TemporaryVttFileRecord,
  streamIndex: number
) =>
  vttFileRecord.parentType === 'MediaFile' &&
  vttFileRecord.streamIndex === streamIndex

const loadSuccess: LoadSuccessHandler<MediaFileRecord> = (
  fileRecord,
  filePath,
  state,
  effects
) => {
  const {
    subtitlesTracksStreamIndexes,
    id,
    subtitles: existingSubtitlesIds,
  } = fileRecord
  const addEmbeddedSubtitlesFiles = from(
    // orphans?
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
}

const locateRequest: LocateRequestHandler<MediaFileRecord> = async (
  action,
  state,
  effects
) => {
  return [
    r.fileSelectionDialog(
      action.message,
      action.fileRecord
    ),
  ]
}

const validateFile = async (
  existingFileRecord: MediaFileRecord,
  filePath: string
  // existingFileRecord: MediaFileMetadata,
  // newFileRecord: MediaFileMetadata
): Promise<[string | null, MediaFileRecord]> => {

  const newFileRecord = await readMediaFileRecord(filePath, existingFileRecord.id, existingFileRecord.parentId, existingFileRecord.subtitles, existingFileRecord.flashcardFieldsToSubtitlesTracks)

  if (existingFileRecord.id !== newFileRecord.id)
    throw new Error("Metadata IDs don't match")

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
    return [`This media file differs from the one on record by: ${differences.join(
      ', '
    )}.`, newFileRecord]
  }

  return [null, newFileRecord]
}

export default {
  loadRequest,
  loadSuccess,
  loadFailure: null,
  locateRequest,
  locateSuccess: null,
} as FileEventHandlers<MediaFileRecord>
