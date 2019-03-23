// import { flatMap } from 'rxjs/operators'
import { flatMap, map } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import ffmpeg from '../utils/ffmpeg'
import tempy from 'tempy'
import { promisify } from 'util'
import fs from 'fs'
import { extname } from 'path'

const readFile = promisify(fs.readFile)

const tmpFilePaths = {}

const audioElement = () => document.getElementById('audioPlayer')
const svgElement = () => document.getElementById('waveform-svg')

// const chooseAudioFilesEpic = (action$, state$) =>
//   action$.pipe(
//     ofType('CHOOSE_AUDIO_FILES'),
//     // turning this to plain map() breaks video playback (maybe audio also)
//     flatMap(async ({ filePaths }) => {
//       if (!filePaths.length) {
//         console.log('No audio file selected')
//       }

//       const [filePath] = filePaths

//       console.log('chose audio files!', filePath)

//       return await r.loadAudio(filePath, audioElement(), svgElement())
//     })
//   )

// const removeAudioFilesEpic = (action$, state$) =>
//   action$.pipe(
//     ofType('REMOVE_AUDIO_FILES'),
//     flatMap(async ({ filePaths }) => {
//       console.log('No audio file selected')

//       return await r.loadAudio(null, audioElement(), svgElement())
//     })
//   )

// const setCurrentFileEpic = (action$, state$) =>
//   action$.pipe(
//     ofType('SET_CURRENT_FILE'),
//     map(() => {
//       const currentFilePath = r.getCurrentFilePath(state$.value)
//       return r.loadAudio(currentFilePath, audioElement(), svgElement())
//     })
//   )

export default combineEpics()
// chooseAudioFilesEpic,
// removeAudioFilesEpic,
// setCurrentFileEpic,
