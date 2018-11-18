import {
  filter,
  map,
  flatMap,
  tap,
  ignoreElements,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { fromEvent, from } from 'rxjs'
import {
  setWaveformPeaks,
  setWaveformCursor,
  loadAudioSuccess,
} from '../actions'
import { getFlashcard } from '../selectors'
import decodeAudioData, { getPeaks } from '../utils/getWaveform'
import { setLocalFlashcard } from '../utils/localFlashcards'
import * as r from '../redux'
import waveformSelectionEpic from './waveformSelectionEpic'
import waveformStretchEpic from './waveformStretchEpic'
import detectSilenceEpic from './detectSilence'
import makeClipsEpic from './makeClips'
import exportFlashcardsEpic from './exportFlashcards'
import { toWaveformCoordinates } from '../utils/waveformCoordinates'
import dataurl from 'dataurl'
import persistStateEpic from './persistState'
import loadAudio from './loadAudio'

const getWaveformEpic = (action$, state$) =>
  action$.pipe(
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
        audioElement.src = dataurl.convert({
          data: file,
          mimetype: 'audio/mp3',
        })
        audioElement.play()
      }, 0)

      return from(decodeAudioData(file)).pipe(
        flatMap(({ buffer }) =>
          from([
            setWaveformPeaks(
              getPeaks(buffer, state$.value.waveform.stepsPerSecond)
            ),
            loadAudioSuccess({
              filename: file.name,
              bufferLength: buffer.length,
            }),
          ])
        )
      )
    })
  )

const setLocalFlashcardEpic = (action$, state$) =>
  action$.pipe(
    ofType('SET_FLASHCARD_FIELD'),
    tap(({ id, key, value }) => {
      const flashcard = getFlashcard(state$.value, id)
      setLocalFlashcard({ ...flashcard, [key]: value })
    }),
    ignoreElements()
  )

const withAudioLoaded = getPiped => (action$, state$) => {
  const [first, ...rest] = getPiped(action$, state$)

  return action$.pipe(
    ofType('LOAD_AUDIO_SUCCESS'),
    withLatestFrom(action$.ofType('LOAD_AUDIO')),
    flatMap(([loadAudioSuccessAction, loadAudioAction]) =>
      first({ ...loadAudioAction, loadAudioSuccessAction }).pipe(
        takeUntil(action$.ofType('LOAD_AUDIO'))
      )
    ),
    ...rest
  )
}

const elementWidth = element => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}

const setWaveformCursorEpic = withAudioLoaded((action$, state$) => [
  ({ audioElement, svgElement }) =>
    fromEvent(audioElement, 'timeupdate').pipe(
      map(e => {
        const viewBox = state$.value.waveform.viewBox
        const newX = Math.round(
          e.target.currentTime && e.target.currentTime * 50
        )
        const svgWidth = elementWidth(svgElement)
        if (newX < viewBox.xMin) {
          return setWaveformCursor(newX, {
            ...viewBox,
            xMin: Math.max(0, newX - svgWidth * 0.9),
          })
        }
        if (newX > svgWidth + viewBox.xMin) {
          return setWaveformCursor(newX, { ...viewBox, xMin: newX })
        }
        return setWaveformCursor(newX)
      })
    ),
])

// const waveformMousemoveEpic = withAudioLoaded((action$, state$) => [
//   ({ audioElement, svgElement }) => fromEvent(svgElement, 'mousemove'),
//   map(mousemove => ({
//     type: 'WAVEFORM_MOUSEMOVE',
//     ...toWaveformCoordinates(mousemove, mousemove.currentTarget, r.getWaveformViewBoxXMin(state$.value)),
//   })),
// ])

const waveformMousedownEpic = withAudioLoaded((action$, state$) => [
  ({ svgElement }) =>
    fromEvent(svgElement, 'mousedown').pipe(tap(e => e.preventDefault())),
  map(mousedown => ({
    type: 'WAVEFORM_MOUSEDOWN',
    ...toWaveformCoordinates(
      mousedown,
      mousedown.currentTarget,
      r.getWaveformViewBoxXMin(state$.value)
    ),
  })),
])
// const waveformMouseupEpic = withAudioLoaded((action$, state$) => [
//   ({ svgElement }) => fromEvent(svgElement, 'mouseup'),
//   map(mouseup => ({
//     type: 'WAVEFORM_MOUSEUP',
//     ...toWaveformCoordinates(mouseup, mouseup.currentTarget, r.getWaveformViewBoxXMin(state$.value)),
//   }))
// ])

const highlightSelectionsOnAddEpic = (action$, state$) =>
  action$.pipe(
    ofType('ADD_WAVEFORM_SELECTION'),
    map(({ selection: { id } }) => r.highlightSelection(id))
  )

const playSelectionsOnHighlightEpic = (action$, state$) =>
  action$.pipe(
    ofType('HIGHLIGHT_WAVEFORM_SELECTION'),
    filter(({ id }) => Boolean(id)),
    withLatestFrom(action$.ofType('LOAD_AUDIO')),
    tap(([{ id: selectionId }, { audioElement }]) => {
      const { start } = r.getWaveformSelection(state$.value, selectionId)
      const newTime = r.getSecondsAtX(state$.value, start)
      audioElement.currentTime = newTime
    }),
    ignoreElements()
  )

export default combineEpics(
  loadAudio,
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
  makeClipsEpic,
  detectSilenceEpic,
  persistStateEpic,
  exportFlashcardsEpic
)
