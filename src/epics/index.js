import { filter, map, flatMap, tap, ignoreElements, takeUntil, withLatestFrom, skipUntil, repeat, endWith, concat, partition, takeLast, last } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { Observable, fromEvent, from, of, iif, merge, empty } from 'rxjs'
import uuid from 'uuid/v4'
import { setWaveformPeaks, setWaveformCursor, setWaveformPendingSelection, addWaveformSelection, loadAudioSuccess } from '../actions'
import { getFlashcard } from '../selectors'
import decodeAudioData, { getPeaks } from '../utils/getWaveform'
import { setLocalFlashcard } from '../utils/localFlashcards'
import * as r from '../redux'

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

const fromMouseEvent = (element, eventName, state) => fromEvent(element, eventName).pipe(
  map(event => ({
    target: event.target,
    waveformX: toWaveformX(event, event.currentTarget, getWaveformViewBoxXMin(state))
  }))
)

const getWaveformViewBoxXMin = (state) => state.waveform.viewBox.xMin

const waveformMousemoveEpic = withAudioLoaded((action$, state$) => [
  ({ audioElement, svgElement }) => fromEvent(svgElement, 'mousemove'),
  map(mousemove => ({
    type: 'WAVEFORM_MOUSEMOVE',
    ...toWaveformCoordinates(mousemove, mousemove.currentTarget, getWaveformViewBoxXMin(state$.value)),
  })),
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
  ({ svgElement }) => fromMouseEvent(svgElement, 'click', state$.value),
  withLatestFrom(action$.ofType('LOAD_AUDIO')),
  flatMap(([{ target, waveformX }, { audioElement, svgElement }]) => {
    const svgBoundingClientRect = svgElement.getBoundingClientRect()
    const ratio = waveformX / (svgBoundingClientRect.right - svgBoundingClientRect.left)

    if (target.id in state$.value.waveform.selections) return of(r.highlightSelection(target.id))


    const newTime = xToTime(waveformX, state$.value.waveform.stepsPerSecond,  state$.value.waveform.stepLength)
    audioElement.currentTime = newTime
    return empty()
    // return r.highlightSelection(null)
  }),
])


const xToTime = (x, stepsPerSecond, stepLength) => x / (stepsPerSecond * stepLength)
const SELECTION_THRESHOLD = 40
const pendingSelectionIsBigEnough = (state) => {
  const { pendingSelection } = state.waveform
  if (!pendingSelection) return false

  const { start, end } = pendingSelection
  return Math.abs(end - start) >= SELECTION_THRESHOLD
}

const selectionIsBigEnough =  ({ start, end }) =>
  Math.abs(end - start) >= SELECTION_THRESHOLD

const getFinalSelection = (pendingSelection) => {
  const [start, end] = [pendingSelection.start, pendingSelection.end].sort()
  return { start, end, id: uuid() }
}

const waveformSelectionEpic = (action$, state$) => action$.pipe(
  ofType('WAVEFORM_MOUSEDOWN'),
  withLatestFrom(action$.ofType('LOAD_AUDIO')),
  flatMap(([waveformMousedown, loadAudio]) => {
    const { svgElement, audioElement } = loadAudio
    const pendingSelections = fromEvent(window, 'mousemove').pipe(
      map((mousemove) => {
        mousemove.preventDefault()
        return setWaveformPendingSelection({
          start: waveformMousedown.x,
          end: toWaveformX(mousemove, svgElement, getWaveformViewBoxXMin(state$.value)),
        })
      }),
      takeUntil(fromEvent(window, 'mouseup')),
    )

    const [bigEnough, notBigEnough] = pendingSelections.pipe(
      takeLast(1),
      partition(() => pendingSelectionIsBigEnough(state$.value))
    )
    return merge(
      pendingSelections,
      bigEnough.pipe(
        map(() => addWaveformSelection(getFinalSelection(r.getWaveformPendingSelection(state$.value))))
      ),
      notBigEnough.pipe(
        tap(({ selection }) => {
          const newTime = xToTime(selection.end, state$.value.waveform.stepsPerSecond,  state$.value.waveform.stepLength)
          audioElement.currentTime = newTime
        }),
        map(() => setWaveformPendingSelection(null))
      ),
    )
  }),
)

const highlightWaveformSelectionEpic = (action$, state$) => action$.pipe(
  ofType('HIGHLIGHT_WAVEFORM_SELECTION'),
  withLatestFrom(action$.ofType('LOAD_AUDIO')),
  tap(([{ id }, { audioElement }]) => {
    const newTime = xToTime(r.getWaveformSelection(state$.value, id).start, state$.value.waveform.stepsPerSecond,  state$.value.waveform.stepLength)
    console.log(newTime)
    audioElement.currentTime = newTime
  }),
  ignoreElements()
)

export default combineEpics(
  getWaveformEpic,
  setLocalFlashcardEpic,
  setWaveformCursorEpic,
  waveformMousemoveEpic,
  waveformMousedownEpic,
  waveformMouseupEpic,
  setAudioCurrentTimeEpic,
  waveformSelectionEpic,
  highlightWaveformSelectionEpic,
)
