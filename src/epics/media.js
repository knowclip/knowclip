import { flatMap, map, switchMap, takeWhile } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import tempy from 'tempy'
import fs from 'fs'
import ffmpeg, { getMediaMetadata } from '../utils/ffmpeg'
import { extname, basename } from 'path'
import uuid from 'uuid/v4'

const tmpFilePaths = {}
const coerceMp3ToConstantBitrate = path => {
  // should check if mp3
  // and if possible, constant vs. variable bitrate
  return new Promise((res, rej) => {
    if (extname(path) !== '.mp3') return res(path)

    let tmpPath = tmpFilePaths[path]
    if (tmpPath) {
      return res(tmpPath)
    }

    tmpPath = tmpFilePaths[path] = tempy.file({ extension: 'mp3' })

    // I guess by default it does CBR
    // though maybe we should check that
    // bitrate and buffersize defaults are ok.
    //   .outputOptions('-bufsize 192k')
    ffmpeg(path)
      .audioBitrate('64k')
      .on('end', () => res(tmpPath))
      .on('error', rej)
      .output(tmpPath)
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

      if (!filePath) {
        // also should open dialog
        return r.openMediaFileFailure(
          "Since this is a shared project, and this is your first time opening this file, you'll first have to locate it on your filesystem."
        )
      }

      if (!fs.existsSync(filePath)) {
        return r.openMediaFileFailure('Could not find media file.')
      }

      try {
        const constantBitrateFilePath = await coerceMp3ToConstantBitrate(
          filePath
        )

        return r.openMediaFileSuccess(filePath, constantBitrateFilePath, id)
      } catch (err) {
        return r.openMediaFileFailure(
          `Error opening media file: ${err.message}`
        )
      }
    }),
    takeWhile(() => r.getCurrentProjectId(state$.value))
  )

const openMediaFileFailure = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_FAILURE'),
    map(({ errorMessage }) => r.simpleMessageSnackbar(errorMessage))
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
              metadata: {
                id: uuid(),
                name: basename(filePath),
                durationSeconds: ffprobeMetadata.format.duration,
                format: ffprobeMetadata.format.format_name,
              },
            }
          })
        )
        return r.addMediaToProject(projectId, metadatas)
      } catch (err) {
        console.log(err)
        return r.simpleMessageSnackbar(
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

export default combineEpics(
  openMedia,
  openMediaFileFailure,
  addMediaToProject,
  openMediaOnAdd
)
