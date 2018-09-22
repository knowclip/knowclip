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

const ascending = (a, b) => a - b
const sortSelectionPoints = ({ start, end }) => [start, end].sort(ascending)
const getFinalSelection = (pendingSelection) => {
  const [start, end] = sortSelectionPoints(pendingSelection)
  return { start, end, id: uuid() }
}

const range = (first, last) => {
  const array = []
  for (let i = first; i += 1; i <= last) {
    array.push(i)
  }
  return array
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
          start: waveformMousedown.x, // should start be called origin instead to match with stretch thing?
          end: toWaveformX(mousemove, svgElement, r.getWaveformViewBoxXMin(state$.value)),
        })
      }),
      takeUntil(mouseups),
    )


    const branched = merge(
      pendingSelections.pipe(takeLast(1)),
      // mouseups.pipe(take(1)) // because click without mousemoves should count too
    ).pipe(
      takeLast(1),
      flatMap((pendingSelectionAction) => {
        // if there were no pendingSelections/moves before mouseup, should still set time
        const { selection: pendingSelection } = pendingSelectionAction
        const overlappedSelectionEnds = [
          r.getSelectionIdAt(state$.value, pendingSelection.start),
          r.getSelectionIdAt(state$.value, pendingSelection.end),
        ]
        console.log('pendingSelection', pendingSelection)
        console.log('overlappedSelectionEnds', overlappedSelectionEnds)

        const selectionsOrder = r.getWaveformSelectionsOrder(state$.value)
        const [firstOverlappedSelectionIndex, secondOverlappedSelectionIndex] =
          overlappedSelectionEnds
            .map(id => selectionsOrder.indexOf(id))
            .sort()

        if (firstOverlappedSelectionIndex !== -1 && secondOverlappedSelectionIndex !== -1) {
          return of(setWaveformPendingSelection(null))
          // const ids = range(firstOverlappedSelectionIndex, secondOverlappedSelectionIndex)
          //   .map(i => selectionsOrder[i])
          // return from([
          //   r.mergeWaveformSelections(ids),
          //   setWaveformPendingSelection(null),
          // ])
        } else if (firstOverlappedSelectionIndex !== -1 || secondOverlappedSelectionIndex !== -1) {
          // should merge all overlapped selections + expand merged selections to encompass pending selection
          return of(setWaveformPendingSelection(null))
        }

        return pendingSelectionIsBigEnough(state$.value)
          ? of(addWaveformSelection(getFinalSelection(r.getWaveformPendingSelection(state$.value))))
          : of(pendingSelectionAction).pipe(
            map((pendingSelectionAction) => {
              const { selection } = pendingSelectionAction
              const x = selection ? sortSelectionPoints(selection)[0] : toWaveformX(pendingSelectionAction, svgElement, r.getWaveformViewBoxXMin(state$.value))
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
          )
      })
    )

    return merge(
      pendingSelections,
      branched
    )
  }),
)

export default waveformSelectionEpic
