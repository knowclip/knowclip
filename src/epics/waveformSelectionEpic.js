import {
  filter,
  map,
  flatMap,
  tap,
  takeUntil,
  withLatestFrom,
  takeLast,
  take,
} from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { fromEvent, of, merge } from 'rxjs'
import { setWaveformPendingSelection, addWaveformSelection } from '../actions'
import * as r from '../redux'
import {
  toWaveformX,
  toWaveformCoordinates,
} from '../utils/waveformCoordinates'
import uuid from 'uuid/v4'
import newClip from '../utils/newClip'

const pendingSelectionIsBigEnough = state => {
  const pendingSelection = r.getWaveformPendingSelection(state)
  if (!pendingSelection) return false

  const { start, end } = pendingSelection
  return Math.abs(end - start) >= r.SELECTION_THRESHOLD
}

const waveformSelectionEpic = (action$, state$) => {
  const loadAudioActions = action$.pipe(ofType('LOAD_AUDIO'))
  const mousedowns = loadAudioActions.pipe(
    flatMap(({ svgElement }) =>
      fromEvent(svgElement, 'mousedown').pipe(takeUntil(loadAudioActions))
    )
  )

  return mousedowns.pipe(
    map(mousedown =>
      toWaveformCoordinates(
        mousedown,
        mousedown.currentTarget,
        r.getWaveformViewBoxXMin(state$.value)
      )
    ),
    // if mousedown falls on edge of selection
    // then start stretchy epic instead of selection epic
    filter(({ x }) => !r.getSelectionEdgeAt(state$.value, x)),
    withLatestFrom(loadAudioActions),
    flatMap(([waveformMousedown, loadAudio]) => {
      const audioElement = document.getElementById('audioPlayer')
      const { svgElement } = loadAudio
      const mouseups = fromEvent(window, 'mouseup').pipe(take(1))
      // this should be used also in stretch epic, i guess at any reference to waveform x
      const factor =
        state$.value.waveform.stepsPerSecond * state$.value.waveform.stepLength
      const withinValidTime = x =>
        Math.max(0, Math.min(x, audioElement.duration * factor))

      const pendingSelections = fromEvent(window, 'mousemove').pipe(
        map(mousemove => {
          mousemove.preventDefault()
          return setWaveformPendingSelection({
            start: withinValidTime(waveformMousedown.x), // should start be called origin instead to match with stretch thing?
            end: withinValidTime(
              toWaveformX(
                mousemove,
                svgElement,
                r.getWaveformViewBoxXMin(state$.value)
              )
            ),
          })
        }),
        takeUntil(mouseups)
      )

      const pendingSelectionEnds = pendingSelections.pipe(
        takeLast(1),
        map(pendingSelectionAction => {
          const { selection: pendingSelection } = pendingSelectionAction
          const selectionsOrder = r.getWaveformSelectionsOrder(state$.value)
          const pendingSelectionOverlaps = [
            r.getSelectionIdAt(state$.value, pendingSelection.start),
            r.getSelectionIdAt(state$.value, pendingSelection.end),
          ].some(id => selectionsOrder.includes(id))
          const currentNoteType = r.getCurrentNoteType(state$.value)

          return pendingSelectionOverlaps ||
            !pendingSelectionIsBigEnough(state$.value)
            ? // maybe later, do stretch + merge for overlaps.
              setWaveformPendingSelection(null)
            : addWaveformSelection(
                newClip(
                  r.getWaveformPendingSelection(state$.value),
                  r.getCurrentFilePath(state$.value),
                  uuid(),
                  currentNoteType,
                  currentNoteType.useTagsField
                    ? r.getDefaultTags(state$.value)
                    : []
                )
              )
        })
      )
      const highlightsAndTimeChanges = mouseups.pipe(
        map(mouseup => {
          const x = toWaveformX(
            mouseup,
            svgElement,
            r.getWaveformViewBoxXMin(state$.value)
          )
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
    })
  )
}

export default waveformSelectionEpic
