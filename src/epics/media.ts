import { flatMap, map, switchMap } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { of, from, Observable } from 'rxjs'
import * as r from '../redux'
import tempy from 'tempy'
import fs from 'fs'
import ffmpeg, { getMediaMetadata, convertMediaMetadata } from '../utils/ffmpeg'
import { extname } from 'path'
import uuid from 'uuid/v4'
import { FfprobeData } from 'fluent-ffmpeg'
import { AppEpic } from '../types/AppEpic'

const getSubtitlesStreamIndexes = (ffprobeMetadata: FfprobeData) =>
  ffprobeMetadata.streams
    .filter(stream => stream.codec_type === 'subtitle')
    .map(stream => stream.index)

const coerceMp3ToConstantBitrate = (
  path: string,
  oldConstantBitratePath: string | null
): Promise<string> => {
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

const openMedia: AppEpic = (action$, state$, { pauseMedia }) =>
  action$.pipe(
    ofType<Action, OpenMediaFileRequest>(A.OPEN_MEDIA_FILE_REQUEST),
    switchMap<OpenMediaFileRequest, Promise<Observable<Action>>>(
      async ({ id }) => {
        pauseMedia()
        // mediaPlayer.src = ''

        const filePath = r.getMediaFilePathFromCurrentProject(state$.value, id)
        const metadata = r.getMediaMetadataFromCurrentProject(state$.value, id)
        const currentProjectId = r.getCurrentProjectId(state$.value)

        if (!metadata)
          return await of(r.openMediaFileFailure('Could not open media file.'))

        if (!currentProjectId)
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
        const subtitlesStreamIndexes = getSubtitlesStreamIndexes(
          ffprobeMetadata
        )
        console.log('ffprobeMetadata', ffprobeMetadata)
        const newMetadata = convertMediaMetadata(ffprobeMetadata, filePath, id)
        const existingMetadata = r.getCurrentMediaMetadata(state$.value)
        if (existingMetadata && existingMetadata.format !== 'UNKNOWN') {
          const differenceMessage = getDifferenceMessage(
            existingMetadata,
            newMetadata
          )
          if (differenceMessage && differenceMessage.length)
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

          return constantBitrateFilePath != null &&
            fs.existsSync(constantBitrateFilePath)
            ? of(r.openMp3Request(id, filePath))
            : from([
                r.simpleMessageSnackbar(
                  'Due to variable bitrate, MP3 files may take a bit longer to open. Please be patient!'
                ),
                r.openMp3Request(id, filePath),
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
      }
    ),
    flatMap(x => x)
    // takeWhile<*, *>(x => r.getCurrentProjectId(state$.value))
    // flatMap(x)
  )

const openMp3: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, OpenMp3Request>(A.OPEN_MP3_REQUEST),
    flatMap(async ({ id, filePath }) => {
      const currentProjectId = r.getCurrentProjectId(state$.value)
      if (!currentProjectId)
        return r.openMediaFileFailure('Could not open media--no project open')
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
          currentProjectId,
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

const openMediaFileFailure: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, OpenMediaFileFailure>(A.OPEN_MEDIA_FILE_FAILURE),
    map(({ errorMessage }) => r.openMediaFileFailureDialog(errorMessage))
  )

const addMediaToProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddMediaToProjectRequest>(A.ADD_MEDIA_TO_PROJECT_REQUEST),
    flatMap(async ({ projectId, filePaths }) => {
      try {
        // use ffprobe to get metadata for all files
        const metadatas = await Promise.all(
          filePaths.map(async filePath => {
            const ffprobeMetadata = await getMediaMetadata(filePath)
            console.log(ffprobeMetadata)
            return {
              filePath,
              constantBitrateFilePath:
                extname(filePath) === '.mp3' ? null : filePath,
              error: null,
              metadata: convertMediaMetadata(ffprobeMetadata, filePath, uuid()),
              subtitles: [],
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

const openMediaOnAdd: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddMediaToProject>(A.ADD_MEDIA_TO_PROJECT),
    map(({ mediaFiles }) => {
      const [{ metadata }] = mediaFiles
      return r.openMediaFileRequest(metadata.id)
    })
  )

const getDifferenceMessage = (
  existingMetadata: MediaFileMetadata,
  newMetadata: MediaFileMetadata
) => {
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

  // TODO: streams/subtitles tracks
}

const locateMediaFile: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, LocateMediaFileRequest>(A.LOCATE_MEDIA_FILE_REQUEST),
    flatMap<LocateMediaFileRequest, Promise<Action>>(
      async ({ id, filePath }) => {
        try {
          const ffprobeMetadata = await getMediaMetadata(filePath)
          const newMetadata = convertMediaMetadata(
            ffprobeMetadata,
            filePath,
            id
          )

          const success = r.locateMediaFileSuccess(id, newMetadata, filePath)

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
      }
    )
  )

const openMediaOnLocate: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, LocateMediaFileSuccess>(A.LOCATE_MEDIA_FILE_SUCCESS),
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
