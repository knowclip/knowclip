import { flatMap, map, catchError } from 'rxjs/operators'
import { of, merge, empty } from 'rxjs'
import * as r from '../redux'
import { from } from 'rxjs'
import { basename } from 'path'
import uuid from 'uuid'
import {
  LoadRequestHandler,
  LoadSuccessHandler,
  LoadFailureHandler,
} from './types'

export const loadRequest: LoadRequestHandler<MediaFileRecord> = async (
  fileRecord,
  filePath,
  state,
  effects
) => {
  effects.pauseMedia()
  // mediaPlayer.src = ''
  return await r.loadFileSuccess(fileRecord, filePath)
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
    subtitlesTracksStreamIndexes
      .filter(
        streamIndex =>
          !existingSubtitlesIds.some(id =>
            streamIndexMatchesExistingTrack(
              state.fileRecords.TemporaryVttFile[id], // orphans?
              streamIndex
            )
          )
      )
      .map(async streamIndex => {
        const { tmpFilePath, chunks } = await effects.getSubtitlesFromMedia(
          filePath,
          streamIndex,
          state
        )
        return r.addFile(
          {
            type: 'TemporaryVttFile',
            parentId: id,
            id: uuid(),
            streamIndex,
            parentType: 'MediaFile',
          },
          tmpFilePath
        )
        // or load existing
      })
  ).pipe(flatMap(x => x))

  const reloadRememberedSubtitles = from(
    existingSubtitlesIds.map(id => {
      const embeddedSubtitles = r.getFileRecord(state, 'TemporaryVttFile', id)
      if (embeddedSubtitles) return r.loadFileRequest(embeddedSubtitles)

      const externalSubtitles = r.getFileRecord(
        state,
        'ExternalSubtitlesFile',
        id
      )
      if (externalSubtitles) return r.loadFileRequest(externalSubtitles)

      return ({ type: 'whoops couldnt find file' } as unknown) as Action
    })
  )
  const cbrPath = r.getMediaFileConstantBitratePathFromCurrentProject(
    state,
    fileRecord.id
  ) as string
  const getWaveform = cbrPath
    ? from(effects.getWaveformPng(state, cbrPath)).pipe(
        //       map(imagePath => r.setWaveformImagePath(imagePath)),
        map(imagePath =>
          r.addFile(
            {
              type: 'WaveformPng',
              parentId: fileRecord.id,
              id: fileRecord.id,
            },
            imagePath
          )
        ),
        catchError(err => of(r.simpleMessageSnackbar(err.message)))
      )
    : empty()
  const fileName = r.getCurrentFileName(state)

  return merge(
    addSubtitlesFiles,
    reloadRememberedSubtitles,
    getWaveform,

    of({
      type: 'SET_DEFAULT_TAGS',
      tags: fileName ? [basename(fileName)] : [],
    } as SetDefaultTags)
  )
}

// export const loadFailure : LoadFailureHandler<MediaFile> = (
//   fileRecord,
//   filePath,
//   errorMessage,
//   state,
//   effects
// ) =>
