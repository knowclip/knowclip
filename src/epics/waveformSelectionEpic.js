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
import { setPendingClip, addClip } from '../actions'
import * as r from '../redux'
import {
  toWaveformX,
  toWaveformCoordinates,
} from '../utils/waveformCoordinates'
import uuid from 'uuid/v4'
import newClip from '../utils/newClip'

const pendingClipIsBigEnough = state => {
  const pendingClip = r.getPendingClip(state)
  if (!pendingClip) return false

  const { start, end } = pendingClip
  return Math.abs(end - start) >= r.SELECTION_THRESHOLD
}

const waveformSelectionEpic = (action$, state$) => {
  const loadAudioActions = action$.pipe(ofType('OPEN_MEDIA_FILE_REQUEST'))
  const mousedowns = loadAudioActions.pipe(
    flatMap(() =>
      fromEvent(document.getElementById('waveform-svg'), 'mousedown').pipe(
        takeUntil(loadAudioActions)
      )
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
    // if mousedown falls on edge of clip
    // then start stretchy epic instead of clip epic
    filter(({ x }) => !r.getClipEdgeAt(state$.value, x)),
    withLatestFrom(loadAudioActions),
    flatMap(([waveformMousedown, loadAudio]) => {
      const audioElement = document.getElementById('audioPlayer')
      const svgElement = document.getElementById('waveform-svg')
      const mouseups = fromEvent(window, 'mouseup').pipe(take(1))
      // this should be used also in stretch epic, i guess at any reference to waveform x
      const factor =
        state$.value.waveform.stepsPerSecond * state$.value.waveform.stepLength
      const withinValidTime = x =>
        Math.max(0, Math.min(x, audioElement.duration * factor))

      const pendingClips = fromEvent(window, 'mousemove').pipe(
        map(mousemove => {
          mousemove.preventDefault()
          return setPendingClip({
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

      const pendingClipEnds = pendingClips.pipe(
        takeLast(1),
        map(pendingClipAction => {
          const { clip: pendingClip } = pendingClipAction
          const clipsOrder = r.getClipsOrder(state$.value)
          const pendingClipOverlaps = [
            r.getClipIdAt(state$.value, pendingClip.start),
            r.getClipIdAt(state$.value, pendingClip.end),
          ].some(id => clipsOrder.includes(id))
          const currentNoteType = r.getCurrentNoteType(state$.value)

          return pendingClipOverlaps || !pendingClipIsBigEnough(state$.value)
            ? // maybe later, do stretch + merge for overlaps.
              setPendingClip(null)
            : addClip(
                newClip(
                  r.getPendingClip(state$.value),
                  r.getCurrentFileId(state$.value),
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
          const clipIdAtX = r.getClipIdAt(state$.value, x)
          return { x, clipIdAtX }
        }),
        // this should probably be done elsewhere.
        // tapping gets repeated unexpectedly, so maybe better always at the 'end' of the epic
        tap(({ x, clipIdAtX }) => {
          const state = state$.value
          const mousePositionOrClipStart = clipIdAtX
            ? r.getClip(state, clipIdAtX).start
            : x
          const newTime = r.getSecondsAtX(state, mousePositionOrClipStart)
          audioElement.currentTime = newTime
        }),
        flatMap(({ x, clipIdAtX }) =>
          clipIdAtX ? of(r.highlightClip(clipIdAtX)) : of(r.highlightClip(null))
        )
      )

      return merge(pendingClips, pendingClipEnds, highlightsAndTimeChanges)
    })
  )
}

export default waveformSelectionEpic
