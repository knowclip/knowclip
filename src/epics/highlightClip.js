import {
  map,
  flatMap,
  withLatestFrom,
  ignoreElements,
  filter,
  tap,
  takeWhile,
} from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { fromEvent, empty, of } from 'rxjs'
import * as r from '../redux'

const audioElement = () => document.getElementById('audioPlayer')
const elementWidth = element => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}

const highlightEpic = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_SUCCESS'),
    flatMap(() =>
      fromEvent(document.getElementById('waveform-svg'), 'mouseup')
    ),
    withLatestFrom(
      action$.pipe(
        ofType('WAVEFORM_MOUSEDOWN'),
        map(({ x }: Action) => {
          const clipIdAtX = r.getClipIdAt(state$.value, x)
          return { x, clipIdAtX }
        })
      )
    ),
    map(([mouseUp, { x, clipIdAtX }]) => {
      const state = state$.value
      const mousePositionOrClipStart = clipIdAtX
        ? r.getClip(state, clipIdAtX).start
        : x
      const newTime = r.getSecondsAtX(state, mousePositionOrClipStart)
      document.getElementById('audioPlayer').currentTime = newTime
      return clipIdAtX ? r.highlightClip(clipIdAtX) : r.highlightClip(null)
    })
  )

const highlightClipsOnAddEpic = (action$, state$) =>
  action$.pipe(
    ofType('ADD_CLIP'),
    map(({ clip: { id } }) => r.highlightClip(id))
  )

const playClipsOnHighlightEpic = (action$, state$) =>
  action$.pipe(
    ofType('HIGHLIGHT_CLIP'),
    filter(({ id }) => Boolean(id)),
    tap(({ id: clipId }) => {
      const { start } = r.getClip(state$.value, clipId)
      const newTime = r.getSecondsAtX(state$.value, start)
      audioElement().currentTime = newTime
      //
      //
      //
      //
      //
      //
      //
      //
      //

      const input = document.querySelector('textarea:not([aria-hidden=true])')
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

const selectClipOnStretch = (action$, state$) =>
  action$.pipe(
    ofType('EDIT_CLIP'),
    filter(({ id, override }) => {
      const isStretch =
        override.start !== undefined || override.end !== undefined
      return isStretch && id !== r.getHighlightedClipId(state$.value)
    }),
    map(({ id }) => r.highlightClip(id))
  )

const HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER = 100
const centerSelectedClip = (action$, state$) =>
  action$.pipe(
    ofType('HIGHLIGHT_CLIP'),
    flatMap(({ id }) => {
      // console.log('highlight!!')
      const clip = r.getClip(state$.value, id)
      if (!clip) return empty()

      const svgElement = document.getElementById('waveform-svg')
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
const deselectClipOnManualChangeTime = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_SUCCESS'),
    flatMap(() =>
      fromEvent(audioElement(), 'seeking').pipe(
        takeWhile(() => r.getConstantBitrateFilePath(state$.value))
      )
    ),
    filter(() => {
      if (!r.isLoopOn(state$.value)) return false

      const highlightedClipId = r.getHighlightedClipId(state$.value)
      if (!highlightedClipId) return false

      const highlightedClip = r.getClip(state$.value, highlightedClipId)
      const x = r.getXAtMilliseconds(
        state$.value,
        audioElement().currentTime * 1000
      )
      return x < highlightedClip.start || x > highlightedClip.end + LOOP_BUFFER
    }),
    map(() => r.highlightClip(null))
  )

export default combineEpics(
  highlightEpic,
  highlightClipsOnAddEpic,
  playClipsOnHighlightEpic,
  selectClipOnStretch,
  centerSelectedClip,
  deselectClipOnManualChangeTime
)
