// import { flatMap } from 'rxjs/operators'
import { flatMap, map } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import ffmpeg from '../utils/ffmpeg'
import tempy from 'tempy'
import { promisify } from 'util'
import fs from 'fs'
import { extname } from 'path'
import {
  hydrateFromProjectFile,
  findExistingProjectFilePath,
} from '../utils/statePersistence'
import { PROJECT_FILE_VERSION_MISMATCH_MESSAGE } from '../selectors/snackbar'

const readFile = promisify(fs.readFile)

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
const svgElement = () => document.getElementById('waveform-svg')

const loadAudioEpic = (action$, state$) =>
  action$.pipe(
    ofType('LOAD_AUDIO'),
    flatMap(async ({ filePath }) => {
      const mediaPlayer = audioElement()
      mediaPlayer.pause()
      mediaPlayer.src = ''
      if (!filePath) {
        mediaPlayer.currentTime = 0

        return await r.loadAudioSuccess(null) // should be failure...
      }

      const constantBitrateFilePath = await coerceMp3ToConstantBitrate(filePath)
      const audio = await readFile(constantBitrateFilePath)

      if (r.getCurrentFilePath(state$.value) !== filePath)
        return { type: 'NOOP_OLD_AUDIO_LOAD' } // really should also cancel old ones

      window.setTimeout(() => {
        mediaPlayer.src = `file:///${constantBitrateFilePath}`
        // mediaPlayer.load()
        mediaPlayer.play()
      }, 0)
      return await r.loadAudioSuccess(audio)
    })
  )

const chooseAudioFilesEpic = (action$, state$) =>
  action$.pipe(
    ofType('CHOOSE_AUDIO_FILES'),
    // turning this to plain map() breaks video playback (maybe audio also)
    flatMap(async ({ filePaths }) => {
      if (!filePaths.length) {
        console.log('No audio file selected')
      }

      const [filePath] = filePaths

      console.log('chose audio files!', filePath)

      return await r.loadAudio(filePath, audioElement(), svgElement())
    })
  )

const loadProjectEpic = (action$, state$) =>
  action$.pipe(
    ofType('CHOOSE_AUDIO_FILES'),
    map(({ filePaths: [filePath] }) => {
      let projectFilePath

      try {
        projectFilePath = findExistingProjectFilePath(filePath)
      } catch (err) {
        console.error(err)
        return { type: 'NOOP_LOAD_PROJECT', err }
      }

      if (!projectFilePath)
        return { type: 'NOOP_LOAD_PROJECT_NO_PROJECT_FILE_FOUND' }

      const hydrated = hydrateFromProjectFile(
        projectFilePath,
        filePath,
        r.getMediaFolderLocation(state$.value),
        state$.noteTypes
      )

      return hydrated
        ? r.hydrateFromProjectFile(hydrated)
        : r.simpleMessageSnackbar(PROJECT_FILE_VERSION_MISMATCH_MESSAGE)
    })
  )

const removeAudioFilesEpic = (action$, state$) =>
  action$.pipe(
    ofType('REMOVE_AUDIO_FILES'),
    flatMap(async ({ filePaths }) => {
      console.log('No audio file selected')

      return await r.loadAudio(null, audioElement(), svgElement())
    })
  )

const setCurrentFileEpic = (action$, state$) =>
  action$.pipe(
    ofType('SET_CURRENT_FILE'),
    map(() => {
      const currentFilePath = r.getCurrentFilePath(state$.value)
      return r.loadAudio(currentFilePath, audioElement(), svgElement())
    })
  )

const initEpic = (action$, state$) =>
  action$.pipe(
    ofType('INITIALIZE_APP'),
    map(() => {
      const currentFilePath = r.getCurrentFilePath(state$.value)
      console.log('currentFilePath', currentFilePath)
      if (!currentFilePath) return { type: 'NOOP' }
      return r.loadAudio(currentFilePath, audioElement(), svgElement())
    })
  )

export default combineEpics(
  loadAudioEpic,
  chooseAudioFilesEpic,
  removeAudioFilesEpic,
  loadProjectEpic,
  setCurrentFileEpic,
  initEpic
)
