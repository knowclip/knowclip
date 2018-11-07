import { filter, map, flatMap, tap, ignoreElements, takeUntil, withLatestFrom, skipUntil, repeat, endWith, concat, partition, takeLast, last, take, startWith, sample } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { Observable, fromEvent, from, of, iif, merge, empty, race } from 'rxjs'
import uuid from 'uuid/v4'
import { setWaveformPeaks, setWaveformPendingSelection, addWaveformSelection, loadAudioSuccess } from '../actions'
import { getFlashcard } from '../selectors'
import decodeAudioData, { getPeaks } from '../utils/getWaveform'
import { setLocalFlashcard } from '../utils/localFlashcards'
import * as r from '../redux'
import { toWaveformX, toWaveformCoordinates } from '../utils/waveformCoordinates'

const pendingSelectionIsBigEnough = (state) => {
  const { pendingSelection } = state.waveform
  if (!pendingSelection) return false

  const { start, end } = pendingSelection
  return Math.abs(end - start) >= r.SELECTION_THRESHOLD
}

const ascending = (a, b) => a - b
const sortSelectionPoints = ({ start, end }) => [start, end].sort(ascending)
const getFinalSelection = (pendingSelection, currentFileName) => {
  const [start, end] = sortSelectionPoints(pendingSelection)
  return { start, end, id: uuid(), filePath: currentFileName }
}

const range = (first, last) => {
  const array = []
  for (let i = first; i += 1; i <= last) {
    array.push(i)
  }
  return array
}

const waveformSelectionEpic = (action$, state$) => {
  const loadAudioActions = action$.pipe(
    ofType('LOAD_AUDIO'),
  )
  const mousedowns = loadAudioActions.pipe(
    flatMap(({ svgElement, audioElement }) =>
      fromEvent(svgElement, 'mousedown').pipe(
        takeUntil(loadAudioActions),
      )
    )
  )

  return mousedowns.pipe(
    map(mousedown => toWaveformCoordinates(mousedown, mousedown.currentTarget, r.getWaveformViewBoxXMin(state$.value))),
    // if mousedown falls on edge of selection
    // then start stretchy epic instead of selection epic
    filter(({ x }) => !r.getSelectionEdgeAt(state$.value, x)),
    withLatestFrom(loadAudioActions),
    flatMap(([waveformMousedown, loadAudio]) => {
      const { svgElement, audioElement } = loadAudio
      const mouseups = fromEvent(window, 'mouseup').pipe(take(1))
      // this should be used also in stretch epic, i guess at any reference to waveform x
      const factor = state$.value.waveform.stepsPerSecond * state$.value.waveform.stepLength
      const withinValidTime = (x) => Math.max(0, Math.min(x, audioElement.duration * factor))

      const pendingSelections = fromEvent(window, 'mousemove').pipe(
        map((mousemove) => {
          mousemove.preventDefault()
          return setWaveformPendingSelection({
            start: withinValidTime(waveformMousedown.x), // should start be called origin instead to match with stretch thing?
            end: withinValidTime(toWaveformX(mousemove, svgElement, r.getWaveformViewBoxXMin(state$.value))),
          })
        }),
        takeUntil(mouseups),
      )

      const pendingSelectionEnds = pendingSelections.pipe(
        takeLast(1),
        map((pendingSelectionAction) => {
          const { selection: pendingSelection } = pendingSelectionAction
          const selectionsOrder = r.getWaveformSelectionsOrder(state$.value)
          const pendingSelectionOverlaps = [
            r.getSelectionIdAt(state$.value, pendingSelection.start),
            r.getSelectionIdAt(state$.value, pendingSelection.end),
          ].some(id => selectionsOrder.includes(id))

          return pendingSelectionOverlaps || !pendingSelectionIsBigEnough(state$.value)
            // maybe later, do stretch + merge for overlaps.
            ? setWaveformPendingSelection(null)
            : addWaveformSelection(getFinalSelection(r.getWaveformPendingSelection(state$.value), r.getCurrentFilePath(state$.value)))
        })
      )
      const highlightsAndTimeChanges = mouseups.pipe(
        map((mouseup) => {
          const x = toWaveformX(mouseup, svgElement, r.getWaveformViewBoxXMin(state$.value))
          const selectionIdAtX = r.getSelectionIdAt(state$.value, x)
          return { x, selectionIdAtX }
        }),
        // this should probably be done elsewhere.
        // tapping gets repeated unexpectedly, so maybe better always at the 'end' of the epic
        tap(({ x, selectionIdAtX }) => {
          const state = state$.value
          const mousePositionOrSelectionStart = selectionIdAtX
            ? r.getWaveformSelection(state, selectionIdAtX).start
            : x
          const newTime = r.getSecondsAtX(state, mousePositionOrSelectionStart)
          audioElement.currentTime = newTime
        }),
        flatMap(({ x, selectionIdAtX }) =>
          selectionIdAtX
            ? of(r.highlightSelection(selectionIdAtX))
            : of(r.highlightSelection(null))
        )
      )

      return merge(
        pendingSelections,
        pendingSelectionEnds,
        highlightsAndTimeChanges
      )
    }),
  )
}

export default waveformSelectionEpic
