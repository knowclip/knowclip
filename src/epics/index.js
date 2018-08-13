import { filter, map, flatMap, tap, ignoreElements, takeUntil, withLatestFrom } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { Observable, fromEvent } from 'rxjs'
import { setWaveformPath, setWaveformCursor } from '../actions'
import { getFlashcard } from '../selectors'
import getWaveform from '../utils/getWaveform'
import { setLocalFlashcard } from '../utils/localFlashcards'

const getWaveformEpic = (action$) => action$.pipe(
  ofType('LOAD_AUDIO'),
  flatMap(({ file, audioElement }) => {
    window.setTimeout(() => {
      const reader = new FileReader()
      reader.onload = (e) => {
        audioElement.src = e.target.result
        audioElement.play()
      }
      reader.readAsDataURL(file)
    }, 0)

    return getWaveform(file)
      .then((svgPath) => setWaveformPath(svgPath))
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
    ofType('LOAD_AUDIO'),
    flatMap((loadAudioAction) => first(loadAudioAction).pipe(
      takeUntil(action$.ofType('LOAD_AUDIO'))
    )),
    ...rest
  )
}

const setWaveformCursorEpic = withAudioLoaded(() => [
  ({ audioElement }) => fromEvent(audioElement, 'timeupdate'),
  map((e) => setWaveformCursor(e.target.currentTime && 100 * (e.target.currentTime / e.target.duration)))
])

const waveformMousemoveEpic = withAudioLoaded(() => [
  ({ audioElement, svgElement }) => fromEvent(svgElement, 'mousemove'),
  map(({ target, clientX, clientY }) => {
    const svgBoundingClientRect = target.getBoundingClientRect()
    return {
      type: 'WAVEFORM_MOUSEMOVE',
      x: clientX - svgBoundingClientRect.left,
      y: clientY - svgBoundingClientRect.top,
    }
  })
])

const waveformClickEpic = withAudioLoaded(() => [
  ({ svgElement }) => fromEvent(svgElement, 'click'),
  map(({ target, clientX, clientY }) => {
    const svgBoundingClientRect = target.getBoundingClientRect()
    return {
      type: 'WAVEFORM_CLICK',
      x: clientX - svgBoundingClientRect.left,
      y: clientY - svgBoundingClientRect.top,
    }
  })
])
const waveformMousedownEpic = withAudioLoaded(() => [
  ({ svgElement }) => fromEvent(svgElement, 'mousedown'),
  map(({ target, clientX, clientY }) => {
    const svgBoundingClientRect = target.getBoundingClientRect()
    return {
      type: 'WAVEFORM_MOUSEDOWN',
      x: clientX - svgBoundingClientRect.left,
      y: clientY - svgBoundingClientRect.top,
    }
  })
])
const waveformMouseupEpic = withAudioLoaded(() => [
  ({ svgElement }) => fromEvent(svgElement, 'mouseup'),
  map(({ target, clientX, clientY }) => {
    const svgBoundingClientRect = target.getBoundingClientRect()
    return {
      type: 'WAVEFORM_MOUSEUP',
      x: clientX - svgBoundingClientRect.left,
      y: clientY - svgBoundingClientRect.top,
    }
  })
])

const setAudioCurrentTimeEpic = withAudioLoaded((action$) => [
  () => action$.ofType('WAVEFORM_CLICK'),
  withLatestFrom(action$.ofType('LOAD_AUDIO')),
  tap(([{ x }, { audioElement, svgElement }]) => {
    const svgBoundingClientRect = svgElement.getBoundingClientRect()
    const ratio = x / (svgBoundingClientRect.right - svgBoundingClientRect.left)
    audioElement.currentTime = ratio * audioElement.duration
  }),
  ignoreElements(),
])

export default combineEpics(
  getWaveformEpic,
  setLocalFlashcardEpic,
  setWaveformCursorEpic,
  waveformMousemoveEpic,
  waveformMousedownEpic,
  waveformMouseupEpic,
  waveformClickEpic,
  setAudioCurrentTimeEpic,
)
