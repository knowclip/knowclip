import {
  map,
  flatMap,
  ignoreElements,
  filter,
  tap,
  takeWhile,
  sample,
  switchMap,
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { fromEvent, empty, of, from } from 'rxjs'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { isOpenFileSuccess } from '../utils/files'
import { setCursor } from './setWaveformCursor'
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
        clipIdAtX: r.getClipIdAt(state$.value, waveformMousedown.x),
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
      const mousePositionOrClipStart = clipIdAtX
        ? (r.getClip(state, clipIdAtX) as Clip).start
        : waveformMousedown.x
      const newTime = r.getSecondsAtX(state, mousePositionOrClipStart)
      effects.setCurrentTime(newTime)
      return clipIdAtX
        ? of(r.highlightClip(clipIdAtX))
        : from([
            setCursor(state$.value, effects.getCurrentTime(), effects),
            r.highlightClip(null),
          ])
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
  { setCurrentTime }
) =>
  action$.pipe(
    ofType<Action, HighlightClip>(A.HIGHLIGHT_CLIP),
    filter(({ id }) => Boolean(id)),
    tap(({ id: clipId }) => {
      const { start } = r.getClip(state$.value, clipId as ClipId) as Clip
      const newTime = r.getSecondsAtX(state$.value, start)
      setCurrentTime(newTime)
      //
      //
      //
      //
      //
      //
      //
      //
      //

      const input = document.querySelector(
        'textarea:not([aria-hidden=true])'
      ) as HTMLTextAreaElement | null
      input && input.focus()
      //
      //
      //
      //
      //
      //
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
      const clip = r.getClip(state$.value, id) as Clip
      if (!clip) return empty()

      const svgElement = getWaveformSvgElement() as SVGElement
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

const LOOP_BUFFER = 25
const deselectClipOnManualChangeTime: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter<Action, OpenFileSuccessWith<MediaFile>>(
      isOpenFileSuccess('MediaFile')
    ),
    switchMap(() =>
      // @ts-ignore
      fromEvent(effects.document, 'seeking', true).pipe(
        takeWhile(() =>
          Boolean(r.getCurrentMediaConstantBitrateFilePath(state$.value))
        )
      )
    ),
    filter(() => {
      if (!r.isLoopOn(state$.value)) return false

      const highlightedClipId = r.getHighlightedClipId(state$.value)
      if (!highlightedClipId) return false

      const highlightedClip = r.getClip(state$.value, highlightedClipId) as Clip
      const x = r.getXAtMilliseconds(
        state$.value,
        effects.getCurrentTime() * 1000
      )
      return x < highlightedClip.start || x > highlightedClip.end + LOOP_BUFFER
    }),
    map(() => r.highlightClip(null))
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
  deselectClipOnManualChangeTime,
  deselectOnOpenMediaFile
)
