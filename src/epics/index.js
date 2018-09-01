import { filter, map, flatMap, tap, ignoreElements, takeUntil, withLatestFrom, skipUntil, repeat, endWith, concat, partition, takeLast, last, take } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { Observable, fromEvent, from, of, iif, merge, empty, race } from 'rxjs'
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

// const waveformMousemoveEpic = withAudioLoaded((action$, state$) => [
//   ({ audioElement, svgElement }) => fromEvent(svgElement, 'mousemove'),
//   map(mousemove => ({
//     type: 'WAVEFORM_MOUSEMOVE',
//     ...toWaveformCoordinates(mousemove, mousemove.currentTarget, getWaveformViewBoxXMin(state$.value)),
//   })),
// ])

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
// const waveformMouseupEpic = withAudioLoaded((action$, state$) => [
//   ({ svgElement }) => fromEvent(svgElement, 'mouseup'),
//   map(mouseup => ({
//     type: 'WAVEFORM_MOUSEUP',
//     ...toWaveformCoordinates(mouseup, mouseup.currentTarget, getWaveformViewBoxXMin(state$.value)),
//   }))
// ])

const xToTime = (x, { stepsPerSecond, stepLength }) => x / (stepsPerSecond * stepLength)

const SELECTION_THRESHOLD = 40
const pendingSelectionIsBigEnough = (state) => {
  const { pendingSelection } = state.waveform
  if (!pendingSelection) return false

  const { start, end } = pendingSelection
  return Math.abs(end - start) >= SELECTION_THRESHOLD
}

const selectionIsBigEnough =  ({ start, end }) =>
  Math.abs(end - start) >= SELECTION_THRESHOLD

const sortSelectionPoints = (selection) => [selection.start, selection.end].sort()
const getFinalSelection = (pendingSelection) => {
  const [start, end] = sortSelectionPoints(pendingSelection)
  return { start, end, id: uuid() }
}

const getSelectionIdAt = (state, x) => {
  const { waveform } = state
  const { selectionsOrder, selections } = waveform
  return selectionsOrder.find(selectionId => {
    const { start, end } = selections[selectionId]
    return x >= start && x <= end
  })
}

const SELECTION_BORDER_WIDTH = 10
const getSelectionEdgeAt = (state, x) => {
  const selectionIdAtX = getSelectionIdAt(state, x)
  if (!selectionIdAtX) return null
  const { start, end } = r.getWaveformSelection(state, selectionIdAtX)
  if (x >= start && x <= start + SELECTION_BORDER_WIDTH) return { key: 'start', id: selectionIdAtX }
  if (x >= end - SELECTION_BORDER_WIDTH && x <= end) return { key: 'end', id: selectionIdAtX }
}

const waveformStretchEpic = (action$, state$) => {
  const selectionMousedowns = action$.pipe(
    ofType('WAVEFORM_MOUSEDOWN'),
    flatMap(({ x }) => {
      const edge = getSelectionEdgeAt(state$.value, x)
      return edge ? of({ x, edge }) : empty()
    }),
    withLatestFrom(action$.ofType('LOAD_AUDIO')),
    flatMap(([{ x, edge: { key, id } }, loadAudio]) => {
      return fromEvent(window, 'mousemove').pipe(
        tap(() => console.log('moving!!')),
        takeUntil(fromEvent(window, 'mouseup')),
        map((mousemove) => {
          console.log('moving!!')
          return {
            type: 'EDIT_WAVEFORM_SELECTION',
            key,
            id,
            value: toWaveformX(mousemove, loadAudio.svgElement, getWaveformViewBoxXMin(state$.value)),
          }
        }),
      )
    })
    // map(({ x, edge }) => ({ type: 'EDIT_WAVEFORM_SELECTION', key: edge.key, id: edge.id, value: r.getWaveformSelection(state$.value, edge.id)[edge.key] + 10 }))
  )
  return selectionMousedowns
}

const waveformSelectionEpic = (action$, state$) => action$.pipe(
  ofType('WAVEFORM_MOUSEDOWN'),
  filter(({ x }) => !getSelectionEdgeAt(state$.value, x)),
  withLatestFrom(action$.ofType('LOAD_AUDIO')),
  flatMap(([waveformMousedown, loadAudio]) => {
    // if mousedown falls on edge of selection
    // then start stretchy epic instead of selection epic
    // const selectionIdAtX = getSelectionIdAt(state$.value, waveformMousedown.x)
    // if (selectionIdAtX && waveformMousedown)

    const { svgElement, audioElement } = loadAudio
    const mouseups = fromEvent(window, 'mouseup')
    const pendingSelections = fromEvent(window, 'mousemove').pipe(
      map((mousemove) => {
        mousemove.preventDefault()
        return setWaveformPendingSelection({
          start: waveformMousedown.x,
          end: toWaveformX(mousemove, svgElement, getWaveformViewBoxXMin(state$.value)),
        })
      }),
      takeUntil(mouseups),
    )

    const [bigEnough, notBigEnough] = merge(
      pendingSelections.pipe(takeLast(1)),
      mouseups.pipe(take(1))
    ).pipe(
      takeLast(1),
      partition(() => pendingSelectionIsBigEnough(state$.value))
    )

    return merge(
      pendingSelections,
      bigEnough.pipe(
        map(() => addWaveformSelection(getFinalSelection(r.getWaveformPendingSelection(state$.value))))
      ),
      notBigEnough.pipe(
        map((val) => {
          const { selection } = val
          const x = selection ? sortSelectionPoints(selection)[0] : toWaveformX(val, svgElement, getWaveformViewBoxXMin(state$.value))
          const selectionIdAtX = getSelectionIdAt(state$.value, x)
          return { x, selectionIdAtX }
        }),
        tap(({ x, selectionIdAtX }) => {
          const newTime = xToTime(selectionIdAtX ? state$.value.waveform.selections[selectionIdAtX].start : x, state$.value.waveform)
          audioElement.currentTime = newTime
        }),
        flatMap(({ x, selectionIdAtX }) =>
          selectionIdAtX
            ? from([r.highlightSelection(selectionIdAtX), setWaveformPendingSelection(null)])
            : of(setWaveformPendingSelection(null))
        )
      ),
    )
  }),
)


const highlightWaveformSelectionEpic = (action$, state$) => merge(
  action$.pipe(
    ofType('ADD_WAVEFORM_SELECTION'),
    withLatestFrom(action$.ofType('LOAD_AUDIO')),
    tap(([{ selection: { start } }, { audioElement }]) => {
      console.log('start', start, 'audioElement', audioElement)
      const newTime = xToTime(start, state$.value.waveform)
      console.log('change time from ADD_WAVEFORM_SELECTION')
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
