import { flatMap, map, catchError } from 'rxjs/operators'
import { of, merge, empty } from 'rxjs'
import * as r from '../redux'
import { from } from 'rxjs'
import { basename } from 'path'
import uuid from 'uuid'
import {
  LoadRequestHandler,
  LoadSuccessHandler,
  LocateRequestHandler,
} from './types'

export const loadRequest: LoadRequestHandler<MediaFileRecord> = async (
  fileRecord,
  filePath,
  state,
  effects
) => {
  effects.pauseMedia()
  // mediaPlayer.src = ''

  //   if (!filePath) {
  //   // also should open dialog
  //   return of(
  //     r.openMediaFileFailure(
  //       `Before opening this media file: \n\n"${
  //         metadata.name
  //       }"\n\nYou'll first have to locate manually on your filesystem.\n\nThis is probably due to using a shared project file, or an older project file format.`
  //     )
  //   )
  // }

  // if (!fs.existsSync(filePath)) {
  //   return of(
  //     r.openMediaFileFailure(
  //       'Could not find media file. It must have moved since the last time you opened it. Try to locate it manually?'
  //     )
  //   )
  // }

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
  const getCbr = fileRecord.format.toLowerCase().includes('mp3')
    ? from(effects.getConstantBitrateMediaPath(filePath, null)).pipe(
        map(cbrFile =>
          r.addFile(
            {
              type: 'ConstantBitrateMp3',
              id: fileRecord.id,
            },
            cbrFile
          )
        )
      )
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
  return await r.fileSelectionDialog(
    `This media file ${
      fileRecord.name
    } appears to have moved or been renamed. Try locating it manually?`,
    fileRecord
  )
}

// export const loadFailure : LoadFailureHandler<MediaFile> = (
//   fileRecord,
//   filePath,
//   errorMessage,
//   state,
//   effects
// ) =>
