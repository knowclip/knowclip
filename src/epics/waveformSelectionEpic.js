import { filter, map, flatMap, tap, ignoreElements, takeUntil, withLatestFrom, skipUntil, repeat, endWith, concat, partition, takeLast, last, take } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { Observable, fromEvent, from, of, iif, merge, empty, race } from 'rxjs'
import uuid from 'uuid/v4'
import { setWaveformPeaks, setWaveformCursor, setWaveformPendingSelection, addWaveformSelection, loadAudioSuccess } from '../actions'
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

const sortSelectionPoints = (selection) => [selection.start, selection.end].sort()
const getFinalSelection = (pendingSelection) => {
  const [start, end] = sortSelectionPoints(pendingSelection)
  return { start, end, id: uuid() }
}


const waveformSelectionEpic = (action$, state$) => action$.pipe(
  ofType('WAVEFORM_MOUSEDOWN'),
  filter(({ x }) => !r.getSelectionEdgeAt(state$.value, x)),
  withLatestFrom(action$.ofType('LOAD_AUDIO')),
  flatMap(([waveformMousedown, loadAudio]) => {
    // if mousedown falls on edge of selection
    // then start stretchy epic instead of selection epic
    // const selectionIdAtX = r.getSelectionIdAt(state$.value, waveformMousedown.x)
    // if (selectionIdAtX && waveformMousedown)

    const { svgElement, audioElement } = loadAudio
    const mouseups = fromEvent(window, 'mouseup')
    const pendingSelections = fromEvent(window, 'mousemove').pipe(
      map((mousemove) => {
        mousemove.preventDefault()
        return setWaveformPendingSelection({
          start: waveformMousedown.x,
          end: toWaveformX(mousemove, svgElement, r.getWaveformViewBoxXMin(state$.value)),
        })
      }),
      takeUntil(mouseups),
    )

    // maybe before splitting off breakoff-worthy setPendingSelections,
    // take out setPendingSelections that end inside an existing selection.
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
          const x = selection ? sortSelectionPoints(selection)[0] : toWaveformX(val, svgElement, r.getWaveformViewBoxXMin(state$.value))
          const selectionIdAtX = r.getSelectionIdAt(state$.value, x)
          return { x, selectionIdAtX }
        }),
        tap(({ x, selectionIdAtX }) => {
          const newTime = r.getTimeAtX(selectionIdAtX ? state$.value.waveform.selections[selectionIdAtX].start : x, state$.value.waveform)
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

export default waveformSelectionEpic
