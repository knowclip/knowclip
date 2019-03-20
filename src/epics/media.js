import { flatMap, debounce, map } from 'rxjs/operators'
import { timer, of } from 'rxjs'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import { promisify } from 'util'
import fs from 'fs'
import ffmpeg from '../utils/ffmpeg'
import tempy from 'tempy'

import { extname } from 'path'

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

// import electron from 'electron'
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const audioElement = () => document.getElementById('audioPlayer')
const openMedia = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_REQUEST'),
    flatMap(async ({ id }) => {
      const mediaPlayer = audioElement()
      mediaPlayer.pause()
      mediaPlayer.src = ''

      const currentProject = r.getCurrentProject(state$.value)
      const filePath = r.getMediaFilePathFromCurrentProject(state$.value, id)

      if (!filePath) {
        // also should open dialog
        return of(
          r.simpleMessageSnackbar(
            "Since this is a shared project, and this is your first time opening this file, you'll first have to locate it on your filesystem."
          )
        )
      }

      if (!fs.existsSync(filePath)) {
        // should show dialog
        return of(r.simpleMessageSnackbar('Could not find media file.'))
      }

      try {
        const constantBitrateFilePath = await coerceMp3ToConstantBitrate(
          filePath
        )
        const audio = await readFile(constantBitrateFilePath)

        // if (r.getCurrentFilePath(state$.value) !== filePath)
        //   return { type: 'NOOP_OLD_AUDIO_LOAD' } // really should also cancel old ones

        window.setTimeout(() => {
          mediaPlayer.src = `file:///${constantBitrateFilePath}`
          // mediaPlayer.load()
          mediaPlayer.play()
        }, 0)

        return of(r.openMediaFileSuccess(filePath))
      } catch (err) {
        return of(
          r.simpleMessageSnackbar(`Error opening media file: ${err.message}`)
        )
      }
    }),
    flatMap(x => x)
  )

export default combineEpics(openMedia)
