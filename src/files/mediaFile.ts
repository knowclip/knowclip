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
} from './types'

export const loadRequest: LoadRequestHandler<MediaFileRecord> = async (
  fileRecord,
  filePath,
  state,
  effects
) => {
  effects.pauseMedia()
  // mediaPlayer.src = ''

  return [r.loadFileSuccess(fileRecord, filePath)]
}

const streamIndexMatchesExistingTrack = (
  vttFileRecord: TemporaryVttFileRecord,
  streamIndex: number
) =>
  vttFileRecord.parentType === 'MediaFile' &&
  vttFileRecord.streamIndex === streamIndex

export const loadSuccess: LoadSuccessHandler<MediaFileRecord> = (
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
  const addSubtitlesFiles = from(
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
        return r.addFile({
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
    r.addFile({
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
        r.addFile({
          type: 'ConstantBitrateMp3',
          id: fileRecord.id,
        }),
      ])
    : empty()

  return merge(
    addSubtitlesFiles,
    reloadRememberedSubtitles,
    getCbr,
    getWaveform,

    of({
      type: 'SET_DEFAULT_TAGS',
      tags: fileName ? [basename(fileName)] : [],
    } as SetDefaultTags)
  )
}

export const locateRequest: LocateRequestHandler<MediaFileRecord> = async (
  fileRecord,
  state,
  effects
) => {
  return [
    r.fileSelectionDialog(
      `This media file ${
        fileRecord.name
      } appears to have moved or been renamed. Try locating it manually?`,
      fileRecord
    ),
  ]
}

// export const loadFailure : LoadFailureHandler<MediaFile> = (
//   fileRecord,
//   filePath,
//   errorMessage,
//   state,
//   effects
// ) =>

export default {
  loadRequest,
  loadSuccess,
  loadFailure: null,
  locateRequest,
  locateSuccess: null,
} as FileEventHandlers<MediaFileRecord>
