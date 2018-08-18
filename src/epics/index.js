import { filter, map, flatMap, tap, ignoreElements, takeUntil, withLatestFrom, skipUntil, repeat, mergeMap, endWith } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { Observable, fromEvent, from } from 'rxjs'
import { setWaveformPeaks, setWaveformCursor, setWaveformPendingSelection, addWaveformSelection, loadAudioSuccess } from '../actions'
import { getFlashcard } from '../selectors'
import decodeAudioData, { getPeaks } from '../utils/getWaveform'
import { setLocalFlashcard } from '../utils/localFlashcards'

const getWaveformEpic = (action$, state$) => action$.pipe(
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

const toWaveformX = (mouseEvent, svgElement, xMin = 0) =>
  mouseEvent.clientX - svgElement.getBoundingClientRect().left + xMin
const toWaveformCoordinates = (mouseEvent, svgElement, xMin = 0) => {
  const { clientX, clientY } = mouseEvent
  const { left, top } = svgElement.getBoundingClientRect()
  return {
    x: clientX - left + xMin,
    y: clientY - top
  }
}

const getWaveformViewBoxXMin = (state) => state.waveform.viewBox.xMin

const waveformMousemoveEpic = withAudioLoaded((action$, state$) => [
  ({ audioElement, svgElement }) => fromEvent(svgElement, 'mousemove'),
  map(mousemove => ({
    type: 'WAVEFORM_MOUSEMOVE',
    ...toWaveformCoordinates(mousemove, mousemove.currentTarget, getWaveformViewBoxXMin(state$.value)),
  })),
])

const waveformClickEpic = withAudioLoaded((action$, state$) => [
  ({ svgElement }) => fromEvent(svgElement, 'click'),
  map((click) => ({
    type: 'WAVEFORM_CLICK',
    ...toWaveformCoordinates(click, click.currentTarget, getWaveformViewBoxXMin(state$.value)),
  }))
])
const waveformMousedownEpic = withAudioLoaded((action$, state$) => [
  ({ svgElement }) =>
    fromEvent(svgElement, 'mousedown').pipe(
      tap(e => e.preventDefault())
    ),
  map(mousedown => ({
    type: 'WAVEFORM_MOUSEDOWN',
    ...toWaveformCoordinates(mousedown, mousedown.currentTarget, getWaveformViewBoxXMin(state$.value)),
  }))
])
const waveformMouseupEpic = withAudioLoaded((action$, state$) => [
  ({ svgElement }) => fromEvent(svgElement, 'mouseup'),
  map(mouseup => ({
    type: 'WAVEFORM_MOUSEUP',
    ...toWaveformCoordinates(mouseup, mouseup.currentTarget, getWaveformViewBoxXMin(state$.value)),
  }))
])

const setAudioCurrentTimeEpic = withAudioLoaded((action$, state$) => [
  () => action$.ofType('WAVEFORM_CLICK'),
  withLatestFrom(action$.ofType('LOAD_AUDIO')),
  tap(([{ x }, { audioElement, svgElement }]) => {
    const svgBoundingClientRect = svgElement.getBoundingClientRect()
    const ratio = x / (svgBoundingClientRect.right - svgBoundingClientRect.left)
    // audioElement.currentTime = ratio * audioElement.duration
    // audioElement.currentTime = x / (state$.value.stepLength * state$.value.stepsPerSecond)
    audioElement.currentTime = x / (state$.value.waveform.stepLength * state$.value.waveform.stepsPerSecond)
  }),
  ignoreElements(),
])


const xToTime = (x, viewBoxXMin, stepsPerSecond, stepLength) => {

}

const waveformSelectionEpic = (action$, state$) => action$.pipe(
  ofType('WAVEFORM_MOUSEDOWN'),
  withLatestFrom(action$.ofType('LOAD_AUDIO')),
  flatMap(([waveformMousedown, loadAudio]) =>
    fromEvent(window, 'mousemove').pipe(
      map((mousemove) => {
        mousemove.preventDefault()
        return setWaveformPendingSelection({
          start: waveformMousedown.x,
          end: toWaveformX(mousemove, loadAudio.svgElement, getWaveformViewBoxXMin(state$.value)),
        })
      }),
      takeUntil(fromEvent(window, 'mouseup')),
      endWith(addWaveformSelection())
    ),
  ),
)

export default combineEpics(
  getWaveformEpic,
  setLocalFlashcardEpic,
  setWaveformCursorEpic,
  waveformMousemoveEpic,
  waveformMousedownEpic,
  waveformMouseupEpic,
  waveformClickEpic,
  setAudioCurrentTimeEpic,
  waveformSelectionEpic,
)
