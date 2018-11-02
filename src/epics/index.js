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

const ffmpeg = require('fluent-ffmpeg') // maybe get rid of define plugin and just get straight from lib?
console.log('booop', process.env.FLUENTFFMPEG_COV)
// Setting ffmpeg path to ffmpeg binary for os x so that ffmpeg can be packaged with the app.
ffmpeg.setFfmpegPath("/usr/local/bin/ffmpeg")
//because of the nature of ffmpeg, this can take both audio or video files as input
const split = () => {
  const path = '/Users/justin/Desktop/ffmpeg-test/audio.mp3'
  const startTime = '00:00:00.000'
  const endTime = '00:00:01.500'
  const outputFilename = '/Users/justin/Desktop/ffmpeg-test/inElectron.mp3'
  const duration = '01.500'
  var aud_file = outputFilename // ?

  ffmpeg(path)
    .audioCodec('copy')
    .seekInput(startTime)
    .inputOptions('-to ' + endTime)
    .output(outputFilename)
    .on('progress', function(progress) {
      //  progress // {"frames":null,"currentFps":null,"currentKbps":256,"targetSize":204871,"timemark":"01:49:15.90"}
      console.log('Processing: ' + progress.timemark + ' done ' + progress.targetSize+' kilobytes');
    })
    .on('end',
    //listener must be a function, so to return the callback wrapping it inside a function
      function() {
           console.log('Finished processing');
        }
    ).run()
}

// // const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// const ffmpegPath = '/usr/local/bin/ffmpeg'
// const split = () => {
//   const args = '-i ~/Desktop/ffmpeg-test/audio.mp3 -acodec copy -ss 00:00:00.000 -to 00:00:01.500 ~/Desktop/ffmpeg-test/fromElectron.mp3'
//   const spawn = require('child_process').spawn;
//   const ffmpeg = spawn(ffmpegPath, args);
//   ffmpeg.on('exit', (...args) => {
//     console.log('done!!', ...args)
//   });
// }

window.split = split

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


const highlightWaveformSelectionEpic = (action$, state$) => merge(
  action$.pipe(
    ofType('ADD_WAVEFORM_SELECTION'),
    withLatestFrom(action$.ofType('LOAD_AUDIO')),
    tap(([{ selection: { start } }, { audioElement }]) => {
      const newTime = r.getTimeAtX(start, state$.value.waveform)
      audioElement.currentTime = newTime
    }),
    ignoreElements(),
  )
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
  highlightWaveformSelectionEpic,
)
