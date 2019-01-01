// import { flatMap } from 'rxjs/operators'
import { flatMap, tap, ignoreElements, map } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { empty, from, of } from 'rxjs'
import * as r from '../redux'
import ffmpeg from '../utils/ffmpeg'
import tempy from 'tempy'
import { promisify } from 'util'
import fs from 'fs'
import dataurl from 'dataurl'

const readFile = promisify(fs.readFile)

const tmpFilePaths = {}

const getConstantBitrateMp3 = path => {
  // should check if mp3
  // and if possible, constant vs. variable bitrate
  return new Promise((res, rej) => {
    let tmpPath = tmpFilePaths[path]
    if (tmpPath) {
      return res(tmpPath)
    }

    tmpPath = tmpFilePaths[path] = tempy.file() + '.mp3'

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
    flatMap(async ({ audioElement, filePath }) => {
      audioElement.pause()
      audioElement.src = ''
      if (!filePath) {
        audioElement.currentTime = 0

        return await r.loadAudioSuccess(null) // should be failure...
      }

      const tmpFilePath = await getConstantBitrateMp3(filePath)
      const audio = await readFile(tmpFilePath)

      if (r.getCurrentFilePath(state$.value) !== filePath)
        return { type: 'NOOP_OLD_AUDIO_LOAD' } // really should also cancel old ones

      window.setTimeout(() => {
        audioElement.src = dataurl.convert({
          data: audio,
          mimetype: 'audio/mp3',
        })
        audioElement.play()
      }, 0)
      return await r.loadAudioSuccess(audio)
    })
  )

const chooseAudioFilesEpic = (action$, state$) =>
  action$.pipe(
    ofType('CHOOSE_AUDIO_FILES'),
    flatMap(async ({ filePaths }) => {
      if (!filePaths.length) {
        console.log('No audio file selected')
      }
      console.log('chose audio files!', filePaths[0])
      return await r.loadAudio(filePaths[0], audioElement(), svgElement())
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
  setCurrentFileEpic,
  initEpic
)
