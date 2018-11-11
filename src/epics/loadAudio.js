import {  flatMap
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import ffmpeg from '../utils/ffmpeg'
import tempy from 'tempy'
import { promisify } from 'util'
import fs from 'fs'

const readFile = promisify(fs.readFile)

const tmpFilePaths = {}
const getTmpFilePath = path => {
}

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

const loadAudio = async (filePath) => {
  const tmpFilePath = await getConstantBitrateMp3(filePath)
  const audio = await readFile(tmpFilePath)
  const audioElement = document.getElementById('audioPlayer')
  const svgElement = document.getElementById('waveform-svg')

  return r.loadAudio(audio, audioElement, svgElement)
}

const chooseAudioFilesEpic = (action$, state$) =>
  action$.pipe(
    ofType('CHOOSE_AUDIO_FILES'),
    flatMap(async ({ filePaths }) => {
      return await loadAudio(filePaths[0])
    })
  )

const setCurrentFileEpic = (action$, state$) =>
  action$.pipe(
    ofType('SET_CURRENT_FILE'),
    flatMap(async () => {
      const currentFilePath = r.getCurrentFilePath(state$.value)
      return await loadAudio(currentFilePath)
    })
  )

export default combineEpics(
  chooseAudioFilesEpic,
  setCurrentFileEpic,
)
