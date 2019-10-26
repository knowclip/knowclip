import {
  map,
  flatMap,
  ignoreElements,
  filter,
  tap,
  takeWhile,
  sample,
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { fromEvent, empty, of } from 'rxjs'
import * as r from '../redux'
import { toWaveformCoordinates } from '../utils/waveformCoordinates'
import { AppEpic } from '../types/AppEpic'
import { isLoadFileSuccess } from '../utils/files'

const elementWidth = (element: Element) => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}

const highlightEpic: AppEpic = (
  action$,
  state$,
  { setCurrentTime, getWaveformSvgElement }
) =>
  action$.pipe(
    filter<Action, LoadFileSuccessWith<MediaFileRecord>>(
      isLoadFileSuccess('MediaFile')
    ),
    flatMap(() =>
      fromEvent<MouseEvent>(
        getWaveformSvgElement() as SVGElement,
        'mousedown'
      ).pipe(
        flatMap(mouseDown => {
          if (r.getPendingStretch(state$.value)) return empty()

          const waveformMouseDown = toWaveformCoordinates(
            mouseDown,
            mouseDown.currentTarget as SVGElement,
            r.getWaveformViewBoxXMin(state$.value)
          )
          return of({
            waveformMouseDown,
            clipIdAtX: r.getClipIdAt(state$.value, waveformMouseDown.x),
          })
        }),
        sample(fromEvent(getWaveformSvgElement() as SVGElement, 'mouseup'))
      )
    ),
    map(({ waveformMouseDown, clipIdAtX }) => {
      const state = state$.value
      const mousePositionOrClipStart = clipIdAtX
        ? (r.getClip(state, clipIdAtX) as Clip).start
        : waveformMouseDown.x
      const newTime = r.getSecondsAtX(state, mousePositionOrClipStart)
      setCurrentTime(newTime)
      return clipIdAtX ? r.highlightClip(clipIdAtX) : r.highlightClip(null)
    })
  )

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
    flatMap(({ id }) => {
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
const deselectClipOnManualChangeTime: AppEpic = (
  action$,
  state$,
  { document, getCurrentTime }
) =>
  action$.pipe(
    filter<Action, LoadFileSuccessWith<MediaFileRecord>>(
      isLoadFileSuccess('MediaFile')
    ),
    flatMap(() =>
      // @ts-ignore
      fromEvent(document, 'seeking', true).pipe(
        takeWhile(() =>
          Boolean(r.getCurrentMediaFileConstantBitratePath(state$.value))
        )
      )
    ),
    filter(() => {
      if (!r.isLoopOn(state$.value)) return false

      const highlightedClipId = r.getHighlightedClipId(state$.value)
      if (!highlightedClipId) return false

      const highlightedClip = r.getClip(state$.value, highlightedClipId) as Clip
      const x = r.getXAtMilliseconds(state$.value, getCurrentTime() * 1000)
      return x < highlightedClip.start || x > highlightedClip.end + LOOP_BUFFER
    }),
    map(() => r.highlightClip(null))
  )

const deselectOnOpenMediaFile: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType(A.LOAD_FILE_REQUEST), // just for media files though
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
