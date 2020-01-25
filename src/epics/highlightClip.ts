import {
  map,
  flatMap,
  ignoreElements,
  filter,
  tap,
  sample,
  switchMap,
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { fromEvent, empty, of, from } from 'rxjs'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'

const elementWidth = (element: Element) => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}

const highlightEpic: AppEpic = (action$, state$, effects) => {
  const waveformMousedowns = fromEvent<WaveformMousedownEvent>(
    effects.document,
    'waveformMousedown'
  )
  return waveformMousedowns.pipe(
    switchMap(waveformMousedown => {
      if (r.getPendingStretch(state$.value)) return empty()

      return of({
        waveformMousedown,
        clipIdAtX: r.getClipIdAt(
          state$.value,
          r.getXAtMilliseconds(state$.value, waveformMousedown.milliseconds)
        ),
      })
    }),
    sample(
      waveformMousedowns.pipe(
        switchMap(waveformMousedown =>
          fromEvent(waveformMousedown.svg, 'mouseup')
        )
      )
    ),
    flatMap(({ waveformMousedown, clipIdAtX }) => {
      const state = state$.value
      const highlightedClipId = r.getHighlightedClipId(state)
      const newTime =
        clipIdAtX && clipIdAtX !== highlightedClipId
          ? (r.getClip(state, clipIdAtX) as Clip).start
          : waveformMousedown.seconds
      effects.setCurrentTime(newTime)

      return clipIdAtX === highlightedClipId
        ? empty()
        : of(r.highlightClip(clipIdAtX))
    })
  )
}

const highlightClipsOnAddEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, AddClip>(A.ADD_CLIP),
    map(({ clip: { id } }) => r.highlightClip(id))
  )

const playClipsOnHighlightEpic: AppEpic = (
  action$,
  state$,
  { setCurrentTime, getCurrentTime }
) =>
  action$.pipe(
    ofType<Action, HighlightClip>(A.HIGHLIGHT_CLIP),
    filter(({ id }) => Boolean(id)),
    tap(({ id: clipId }) => {
      const { start, end } = r.getClip(state$.value, clipId as ClipId) as Clip

      const { durationSeconds } = r.getCurrentMediaFile(
        state$.value
      ) as MediaFile
      const newTime = Math.min(
        durationSeconds,
        r.getSecondsAtX(state$.value, start)
      )
      const currentTime = getCurrentTime()
      if (
        currentTime <= r.getSecondsAtX(state$.value, start) ||
        currentTime >= r.getSecondsAtX(state$.value, end)
      )
        setCurrentTime(newTime)
    }),
    ignoreElements()
  )

const selectClipOnStretch: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, EditClip>(A.EDIT_CLIP),
    filter(({ id, override }) => {
      const isStretch =
        override.start !== undefined || override.end !== undefined
      return isStretch
    }),
    map(({ id }) => r.highlightClip(id))
  )

const HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER = 100
const centerSelectedClip: AppEpic = (
  action$,
  state$,
  { getWaveformSvgElement }
) =>
  action$.pipe(
    ofType<Action, HighlightClip>(A.HIGHLIGHT_CLIP),
    switchMap(({ id }) => {
      if (!id) return empty()
      const clip = r.getClip(state$.value, id)
      if (!clip) return empty()

      const svgElement = getWaveformSvgElement()
      if (!svgElement) return empty()
      const svgWidth = elementWidth(svgElement)

      const svgFits = clip.end - clip.start <= svgWidth
      if (!svgFits) return empty()

      const { xMin } = state$.value.waveform.viewBox

      if (clip.start - xMin < HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER)
        return of(
          r.setWaveformViewBox({
            xMin: Math.max(
              0,
              clip.start - HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER
            ),
          })
        )

      if (xMin + svgWidth - clip.end < HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER)
        return of(
          r.setWaveformViewBox({
            xMin:
              clip.end + HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER - svgWidth,
          })
        )

      return empty()
    })
  )

const deselectOnOpenMediaFile: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, OpenFileRequest>(A.OPEN_FILE_REQUEST),
    filter(({ file }) => file.type === 'MediaFile'),
    map(() => r.highlightClip(null))
  )

export default combineEpics(
  highlightEpic,
  highlightClipsOnAddEpic,
  playClipsOnHighlightEpic,
  selectClipOnStretch,
  centerSelectedClip,
  deselectOnOpenMediaFile
)
