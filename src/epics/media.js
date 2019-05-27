import { flatMap, map, switchMap, takeWhile } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { of, from } from 'rxjs'
import * as r from '../redux'
import tempy from 'tempy'
import fs from 'fs'
import ffmpeg, { getMediaMetadata, convertMediaMetadata } from '../utils/ffmpeg'
import { extname } from 'path'
import uuid from 'uuid/v4'
import { getSubtitlesFromMedia } from './subtitles'

const getSubtitlesStreamIndexes = ffprobeMetadata =>
  ffprobeMetadata.streams
    .filter(stream => stream.codec_type === 'subtitle')
    .map(stream => stream.index)

const coerceMp3ToConstantBitrate = (path, oldConstantBitratePath) => {
  // should check if mp3
  // and if possible, constant vs. variable bitrate
  return new Promise((res, rej) => {
    if (extname(path) !== '.mp3') return res(path)
    if (oldConstantBitratePath && fs.existsSync(oldConstantBitratePath))
      return res(oldConstantBitratePath)

    const constantBitratePath = tempy.file({ extension: 'mp3' })

    // I guess by default it does CBR
    // though maybe we should check that
    // bitrate and buffersize defaults are ok.
    //   .outputOptions('-bufsize 192k')
    ffmpeg(path)
      .audioBitrate('64k')
      .on('end', () => res(constantBitratePath))
      .on('error', rej)
      .output(constantBitratePath)
      .run()
  })
}

const audioElement = () => document.getElementById('audioPlayer')
const openMedia = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_REQUEST'),
    switchMap(async ({ id }) => {
      const mediaPlayer = audioElement()
      mediaPlayer.pause()
      mediaPlayer.src = ''

      // const currentProject = r.getCurrentProject(state$.value)
      const filePath = r.getMediaFilePathFromCurrentProject(state$.value, id)
      const metadata = r.getMediaMetadataFromCurrentProject(state$.value, id)
      if (!metadata)
        return of(r.openMediaFileFailure('Could not open media file.'))

      if (!filePath) {
        // also should open dialog
        return of(
          r.openMediaFileFailure(
            `Before opening this media file: \n\n"${
              metadata.name
            }"\n\nYou'll first have to locate manually on your filesystem.\n\nThis is probably due to using a shared project file, or an older project file format.`
          )
        )
      }

      if (!fs.existsSync(filePath)) {
        return of(
          r.openMediaFileFailure(
            'Could not find media file. It must have moved since the last time you opened it. Try to locate it manually?'
          )
        )
      }

      const ffprobeMetadata = await getMediaMetadata(filePath)
      const subtitlesStreamIndexes = getSubtitlesStreamIndexes(ffprobeMetadata)
      console.log('ffprobeMetadata', ffprobeMetadata)
      const newMetadata = convertMediaMetadata(ffprobeMetadata, filePath, id)
      const currentProjectId = r.getCurrentProjectId(state$.value)
      const existingMetadata = r.getCurrentMediaMetadata(state$.value)
      if (existingMetadata && existingMetadata.format !== 'UNKNOWN') {
        const differenceMessage = getDifferenceMessage(
          existingMetadata,
          newMetadata
        )
        if (differenceMessage)
          return from([
            r.simpleMessageSnackbar(differenceMessage),
            r.openMediaFileSuccess(
              filePath,
              filePath,
              newMetadata,
              currentProjectId,
              subtitlesStreamIndexes
            ),
          ])
      }

      if (extname(filePath) === '.mp3') {
        const constantBitrateFilePath = r.getMediaFileConstantBitratePathFromCurrentProject(
          state$.value,
          id
        )
        return from([
          ...(constantBitrateFilePath && fs.existsSync(constantBitrateFilePath)
            ? []
            : [
                r.simpleMessageSnackbar(
                  'Due to variable bitrate, MP3 files may take a bit longer to open. Please be patient!'
                ),
              ]),
          { type: 'OPEN_MP3_REQUEST', id, filePath },
        ])
      }

      // newMetadata might actually be same? :| but if not it overrides 'UNKNOWN' format
      return of(
        r.openMediaFileSuccess(
          filePath,
          filePath,
          newMetadata,
          currentProjectId,
          subtitlesStreamIndexes
        )
      )
    }),
    flatMap(x => x),
    takeWhile(() => r.getCurrentProjectId(state$.value))
  )

const openMp3 = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MP3_REQUEST'),
    flatMap(async ({ id, filePath }) => {
      try {
        const constantBitrateFilePath = await coerceMp3ToConstantBitrate(
          filePath,
          r.getMediaFileConstantBitratePathFromCurrentProject(state$.value, id)
        )

        const ffprobeMetadata = await getMediaMetadata(filePath)
        const metadata = convertMediaMetadata(ffprobeMetadata, filePath, id)

        return r.openMediaFileSuccess(
          filePath,
          constantBitrateFilePath,
          metadata,
          r.getCurrentProjectId(state$.value),
          getSubtitlesStreamIndexes(ffprobeMetadata)
        )
      } catch (err) {
        return r.openMediaFileFailure(
          `Error opening media file: ${
            err.message
          }\n\n Try to locate it manually?`
        )
      }
    })
  )

const openMediaFileFailure = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_FAILURE'),
    map(({ errorMessage }) => r.openMediaFileFailureDialog(errorMessage))
  )

const addMediaToProject = (action$, state$) =>
  action$.pipe(
    ofType('ADD_MEDIA_TO_PROJECT_REQUEST'),
    flatMap(async ({ projectId, filePaths }) => {
      try {
        // use ffprobe to get metadata for all files
        const metadatas = await Promise.all(
          filePaths.map(async filePath => {
            const ffprobeMetadata = await getMediaMetadata(filePath)
            console.log(ffprobeMetadata)
            return {
              filePath,
              metadata: convertMediaMetadata(ffprobeMetadata, filePath, uuid()),
            }
          })
        )
        return await r.addMediaToProject(projectId, metadatas)
      } catch (err) {
        console.log(err)
        return await r.simpleMessageSnackbar(
          `Error adding media file: ${err.message}`
        )
      }
    })
  )

const openMediaOnAdd = (action$, state$) =>
  action$.pipe(
    ofType('ADD_MEDIA_TO_PROJECT'),
    map(({ mediaFilePaths }) => {
      const [{ metadata }] = mediaFilePaths
      return r.openMediaFileRequest(metadata.id)
    })
  )

const getDifferenceMessage = (existingMetadata, newMetadata) => {
  if (existingMetadata.id !== newMetadata.id)
    throw new Error("Metadata IDs don't match")

  const differences = []

  if (existingMetadata.name !== newMetadata.name) differences.push('name')
  if (existingMetadata.durationSeconds !== newMetadata.durationSeconds)
    differences.push('duration')
  if (existingMetadata.durationSeconds !== newMetadata.durationSeconds)
    differences.push('format')

  if (differences.length) {
    return `This media file differs from the one on record by: ${differences.join(
      ', '
    )}.`
  }
}

const locateMediaFile = (action$, state$) =>
  action$.pipe(
    ofType('LOCATE_MEDIA_FILE_REQUEST'),
    flatMap(async ({ id, filePath }) => {
      try {
        const ffprobeMetadata = await getMediaMetadata(filePath)
        const newMetadata = convertMediaMetadata(ffprobeMetadata, filePath, id)

        const currentProjectId = r.getCurrentProjectId(state$.value)

        const success = r.locateMediaFileSuccess(
          id,
          newMetadata,
          currentProjectId,
          filePath
        )

        const existingMetadata = r.getCurrentMediaMetadata(state$.value)
        if (existingMetadata && existingMetadata.format !== 'UNKNOWN') {
          const differenceMessage = getDifferenceMessage(
            existingMetadata,
            newMetadata
          )
          if (differenceMessage)
            return r.confirmationDialog(
              `${differenceMessage} Do you want to try using this file anyway?`,
              success
            )
        }

        return success
      } catch (err) {
        console.error(err)
        return r.simpleMessageSnackbar(
          `There was a problem opening this media file. ${err.message}`
        )
      }
    })
  )

const openMediaOnLocate = (action$, state$) =>
  action$.pipe(
    ofType('LOCATE_MEDIA_FILE_SUCCESS'),
    map(({ id }) => r.openMediaFileRequest(id))
  )

export default combineEpics(
  openMedia,
  openMp3,
  openMediaFileFailure,
  addMediaToProject,
  openMediaOnAdd,
  locateMediaFile,
  openMediaOnLocate
)
