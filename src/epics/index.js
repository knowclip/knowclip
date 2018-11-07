import { filter, map, flatMap, tap, ignoreElements, takeUntil, withLatestFrom, skipUntil, repeat, endWith, concat, partition, takeLast, last, take } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { Observable, fromEvent, from, of, iif, merge, empty, race } from 'rxjs'
import uuid from 'uuid/v4'
import { setWaveformPeaks, setWaveformCursor, setWaveformPendingSelection, addWaveformSelection, loadAudioSuccess } from '../actions'
import { getFlashcard } from '../selectors'
import decodeAudioData, { getPeaks } from '../utils/getWaveform'
import { setLocalFlashcard } from '../utils/localFlashcards'
import * as r from '../redux'
import waveformSelectionEpic from './waveformSelectionEpic'
import waveformStretchEpic from './waveformStretchEpic'
import { toWaveformX, toWaveformCoordinates } from '../utils/waveformCoordinates'
import dataurl from 'dataurl'
// import fs from 'fs'
import electron from 'electron'
import os from 'os'
import { join, basename, extname } from 'path'

const { remote } = electron

const { dialog } = remote

console.log('booop', process.env.FLUENTFFMPEG_COV)
const ffmpeg = require('fluent-ffmpeg') // maybe get rid of define plugin and just get straight from lib?
// Setting ffmpeg path to ffmpeg binary for os x so that ffmpeg can be packaged with the app.
// console.log('ffmpeg',  require('@ffmpeg-installer/ffmpeg'))
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const platform = os.platform() + '-' + os.arch()
// const ffmpegPath = require('@ffmpeg-installer/' + platform + '/ffmpeg')
const ffmpegPath = join('.', 'node_modules', '@ffmpeg-installer', platform, 'ffmpeg')

console.log('ffmpegPath', ffmpegPath)
console.log(ffmpegPath)
ffmpeg.setFfmpegPath(ffmpegPath) // ("/usr/local/bin/ffmpeg")
//because of the nature of ffmpeg, this can take both audio or video files as input

const path = '/Users/justin/Desktop/ffmpeg-test/audio.mp3'
const startTime = '00:00:00.000'
const endTime = '00:00:01.500'
const outputFilename = '/Users/justin/Desktop/ffmpeg-test/inElectron.mp3'

const toTimestamp = (milliseconds) => {
  const millisecondsStamp = Math.round(milliseconds % 1000)
  const secondsStamp = Math.floor(milliseconds / 1000) % 60
  const minutesStamp = Math.floor(milliseconds / 1000 / 60) % 60
  const hoursStamp = Math.floor(milliseconds / 1000 / 60 / 60)
  return `${hoursStamp}:${minutesStamp}:${secondsStamp}.${millisecondsStamp}`
}
const clip = (path, startTime, endTime, outputFilename) => {
  var aud_file = outputFilename // ?

  return new Promise((res, rej) => {
    ffmpeg(path)
      .audioCodec('copy')
      .seekInput(toTimestamp(startTime))
      .inputOptions('-to ' + toTimestamp(endTime))
      .output(outputFilename)
      .on('progress', function(progress) {
        //  progress // {"frames":null,"currentFps":null,"currentKbps":256,"targetSize":204871,"timemark":"01:49:15.90"}
        console.log('Processing: ' + progress.timemark + ' done ' + progress.targetSize+' kilobytes');
      })
      .on('end',
      //listener must be a function, so to return the callback wrapping it inside a function
        function() {
             console.log('Finished processing');
             res()
          }
      )
      .on('error', (err) => {
        rej(err)
      })
      .run()
  })
}

console.log('boop?', 'wat')

const detectSilence = (path, silenceDuration = 1, silenceNoiseTolerance = -60) => new Promise((res, rej) => {
  ffmpeg(path, { stdoutLines: 0 })
    .audioFilters(`silencedetect=n=${silenceNoiseTolerance}dB:d=${silenceDuration}`)
    .outputFormat('null')
    .output('-')
    .on('progress', function(progress) {
      //  progress // {"frames":null,"currentFps":null,"currentKbps":256,"targetSize":204871,"timemark":"01:49:15.90"}
      console.log('Processing: ' + progress.timemark + ' done ' + progress.targetSize+' kilobytes');
    })
    .on('end',
    //listener must be a function, so to return the callback wrapping it inside a function
    function(_, string) {
      // res()
      const preparedString = string.replace(/\s/g,' ')
      const regex = /silence_start:\s(\d+\.\d+|\d+).+?silence_end:\s(\d+\.\d+|\d+)/g
      console.log('bloop!', preparedString)
      window.preparedString = preparedString

      const matchData = []
      let addition
      while (addition = regex.exec(preparedString)) {
        const [_, startStr, endStr] = addition
        console.log('exect!')
        matchData.push({
          start: Number(startStr) * 1000,
          end: Number(endStr) * 1000,
        })
      }
      console.log(preparedString, regex.exec(preparedString))
      console.log('matchData', matchData)
      res(matchData)
    }
  )
  .on('error', (err) => {
    rej(err)
    console.error(err)
  })
  .run()
})
Object.assign(window, { detectSilence })






 // -i audio.mp3 -af silencedetect=d=2 -f null -

// // const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// const ffmpegPath = '/usr/local/bin/ffmpeg'
// const clip = () => {
//   const args = '-i ~/Desktop/ffmpeg-test/audio.mp3 -acodec copy -ss 00:00:00.000 -to 00:00:01.500 ~/Desktop/ffmpeg-test/fromElectron.mp3'
//   const spawn = require('child_process').spawn;
//   const ffmpeg = spawn(ffmpegPath, args);
//   ffmpeg.on('exit', (...args) => {
//     console.log('done!!', ...args)
//   });
// }

window.clip = clip

const makeClips = (action$, state$) => action$.pipe(
  ofType('MAKE_CLIPS'),
  tap(() => {
    const clips = r.getWaveformSelections(state$.value)
    dialog.showOpenDialog({ properties: ['openDirectory'] }, (filePaths) => {
      if (!filePaths) return


      const [directory] = filePaths
      clips.forEach(({ start, end, filePath }) => {
        const startTime = r.getMillisecondsAtX(state$.value, start)
        const endTime = r.getMillisecondsAtX(state$.value, end)
        const extension = extname(filePath)
        const filenameWithoutExtension = basename(filePath, extension)
        const outputFilename = `${filenameWithoutExtension}__${startTime}-${endTime}${extension}`
        const outputFilePath = join(directory, outputFilename)
        console.log('clippng!', filePath, outputFilePath)
        clip(filePath, startTime, endTime, outputFilePath)
      })
    })
  }),
  ignoreElements(),
)

const ascending = (a, b) => a - b
const sortSelectionPoints = ({ start, end }) => [start, end].sort(ascending)
const getFinalSelection = (pendingSelection, currentFileName) => {
  const [start, end] = sortSelectionPoints(pendingSelection)
  return { start, end, id: uuid(), filePath: currentFileName }
}
const detectSilenceEpic = (action$, state$) => action$.pipe(
  ofType('DETECT_SILENCE'),
  withLatestFrom(action$.ofType('LOAD_AUDIO')),
  flatMap(([_, { audioElement }]) => {
    return detectSilence(r.getCurrentFilePath(state$.value)).then(silences => {
      if (!silences.length) return [{ type: 'NOOP' }]

      const chunks = []
      if (silences[0].start > 0) chunks.push({ start: 0, end: silences[0].start })
      silences.forEach(({ end: silenceEnd }, i) => {
        const nextSilence = silences[i + 1]
        if (nextSilence) {
          chunks.push({ start: silenceEnd, end: nextSilence.start })
        } else  {
          const durationMs = audioElement.duration * 1000
          if (silenceEnd !== durationMs)
          chunks.push({ start: silenceEnd, end: durationMs })
        }
      })

      return chunks.map(({ start, end }) => r.addWaveformSelection(getFinalSelection({
        start: r.getXAtMilliseconds(state$.value, start),
        end: r.getXAtMilliseconds(state$.value, end),
      }, r.getCurrentFilePath(state$.value))))
    })
  }),
  flatMap(val => from(val))
)


const getWaveformEpic = (action$, state$) => action$.pipe(
  ofType('LOAD_AUDIO'),
  flatMap(({ file, audioElement }) => {
    // window.setTimeout(() => {
    //   const reader = new FileReader()
    //   reader.onload = (e) => {
    //     audioElement.src = e.target.result
    //     audioElement.play()
    //   }
    //   reader.readAsDataURL(file)
    // }, 0)
    window.setTimeout(() => {
      audioElement.src = dataurl.convert({ data: file, mimetype: 'audio/mp3' })
      audioElement.play()
    }, 0)

    return from(decodeAudioData(file)).pipe(
      flatMap(({ buffer }) => from([
        setWaveformPeaks(getPeaks(buffer, state$.value.waveform.stepsPerSecond)),
        loadAudioSuccess({ filename: file.name, bufferLength: buffer.length })
      ]))
    )
  })
)

const setLocalFlashcardEpic = (action$, state$) => action$.pipe(
  ofType('SET_FLASHCARD_FIELD'),
  tap(({ id, key, value }) => {
    const flashcard = getFlashcard(state$.value, id)
    setLocalFlashcard({ ...flashcard, [key]: value })
  }),
  ignoreElements(),
)

const withAudioLoaded = (getPiped) => (action$, state$) => {
  const [first, ...rest] = getPiped(action$, state$)

  return action$.pipe(
    ofType('LOAD_AUDIO_SUCCESS'),
    withLatestFrom(action$.ofType('LOAD_AUDIO')),
    flatMap(([loadAudioSuccessAction, loadAudioAction]) => first({ ...loadAudioAction, loadAudioSuccessAction }).pipe(
      takeUntil(action$.ofType('LOAD_AUDIO'))
    )),
    ...rest
  )
}

const elementWidth = (element) => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left;
}

const setWaveformCursorEpic = withAudioLoaded((action$, state$) => [
  ({ audioElement, svgElement }) => fromEvent(audioElement, 'timeupdate').pipe(
    map((e) => {
      const viewBox = state$.value.waveform.viewBox
      const newX = Math.round(e.target.currentTime && (e.target.currentTime * 50))
      const svgWidth = elementWidth(svgElement)
      if (newX < viewBox.xMin) {
        return setWaveformCursor(newX, { ...viewBox, xMin: Math.max(0, newX - svgWidth * .9) })
      }
      if (newX > svgWidth + viewBox.xMin) {
        return setWaveformCursor(newX, { ...viewBox, xMin: newX })
      }
      return setWaveformCursor(newX)
    }),
  ),
])


const fromMouseEvent = (element, eventName, state) => fromEvent(element, eventName).pipe(
  map(event => ({
    target: event.target,
    waveformX: toWaveformX(event, event.currentTarget, r.getWaveformViewBoxXMin(state))
  }))
)


// const waveformMousemoveEpic = withAudioLoaded((action$, state$) => [
//   ({ audioElement, svgElement }) => fromEvent(svgElement, 'mousemove'),
//   map(mousemove => ({
//     type: 'WAVEFORM_MOUSEMOVE',
//     ...toWaveformCoordinates(mousemove, mousemove.currentTarget, r.getWaveformViewBoxXMin(state$.value)),
//   })),
// ])

const waveformMousedownEpic = withAudioLoaded((action$, state$) => [
  ({ svgElement }) =>
    fromEvent(svgElement, 'mousedown').pipe(
      tap(e => e.preventDefault())
    ),
  map(mousedown => ({
    type: 'WAVEFORM_MOUSEDOWN',
    ...toWaveformCoordinates(mousedown, mousedown.currentTarget, r.getWaveformViewBoxXMin(state$.value)),
  }))
])
// const waveformMouseupEpic = withAudioLoaded((action$, state$) => [
//   ({ svgElement }) => fromEvent(svgElement, 'mouseup'),
//   map(mouseup => ({
//     type: 'WAVEFORM_MOUSEUP',
//     ...toWaveformCoordinates(mouseup, mouseup.currentTarget, r.getWaveformViewBoxXMin(state$.value)),
//   }))
// ])


const highlightSelectionsOnAddEpic = (action$, state$) => action$.pipe(
  ofType('ADD_WAVEFORM_SELECTION'),
  map(({ selection: { id } }) => r.highlightSelection(id)),
)


const playSelectionsOnHighlightEpic = (action$, state$) => action$.pipe(
  ofType('HIGHLIGHT_WAVEFORM_SELECTION'),
  filter(({ id }) => Boolean(id)),
  withLatestFrom(action$.ofType('LOAD_AUDIO')),
  tap(([{ id: selectionId }, { audioElement }]) => {
    const { start } = r.getWaveformSelection(state$.value, selectionId)
    const newTime = r.getSecondsAtX(state$.value, start)
    audioElement.currentTime = newTime
  }),
  ignoreElements(),
)


export default combineEpics(
  getWaveformEpic,
  setLocalFlashcardEpic,
  setWaveformCursorEpic,
  // waveformMousemoveEpic,
  waveformMousedownEpic,
  // waveformMouseupEpic,
  waveformSelectionEpic,
  waveformStretchEpic,
  highlightSelectionsOnAddEpic,
  playSelectionsOnHighlightEpic,
  makeClips,
  detectSilenceEpic,
)
