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
import { fromEvent, empty, of } from 'rxjs'
import * as r from '../redux'
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

const highlightRightEpic: AppEpic = (action$, state$, { getCurrentTime }) =>
  action$.pipe(
    ofType<Action, HighlightRightClipRequest>(A.HIGHLIGHT_RIGHT_CLIP_REQUEST),
    flatMap(() => {
      const state = state$.value
      const currentFileId = r.getCurrentFileId(state)
      if (!currentFileId) return empty()

      const currentFileClipIds = state.clips.idsByMediaFileId[currentFileId]

      const highlightedClipId = r.getHighlightedClipId(state)
      if (highlightedClipId) {
        const nextIndex = currentFileClipIds.indexOf(highlightedClipId) + 1
        const lastIndex = currentFileClipIds.length - 1
        const nextId = currentFileClipIds[nextIndex > lastIndex ? 0 : nextIndex]
        if (nextId) return of(r.highlightClip(nextId))
      }

      const x = r.getXAtMilliseconds(state$.value, getCurrentTime() * 1000)

      const nextClipId = currentFileClipIds.find(
        clipId => (r.getClip(state, clipId) || { start: 0 }).start >= x
      )

      return nextClipId ? of(r.highlightClip(nextClipId)) : empty()
    })
  )

const findLast = <T>(array: Array<T>, predicate: (item: T) => boolean) => {
  if (!array.length) return null
  for (let i = array.length - 1; i >= 0; i -= 1) {
    const item = array[i]
    if (predicate(item)) return item
  }
}

const highlightLeftEpic: AppEpic = (
  action$,
  state$,
  { window, getCurrentTime }
) =>
  action$.pipe(
    ofType<Action, HighlightLeftClipRequest>(A.HIGHLIGHT_LEFT_CLIP_REQUEST),
    flatMap(() => {
      const state = state$.value
      const currentFileId = r.getCurrentFileId(state)
      if (!currentFileId) return empty()

      const currentFileClipIds = state.clips.idsByMediaFileId[currentFileId]

      const highlightedClipId = r.getHighlightedClipId(state)
      if (highlightedClipId) {
        const highlightedIndex = currentFileClipIds.indexOf(highlightedClipId)
        const nextId =
          currentFileClipIds[
            highlightedIndex === 0
              ? currentFileClipIds.length - 1
              : highlightedIndex - 1
          ]
        return of(r.highlightClip(nextId))
      }
      const x = r.getXAtMilliseconds(state$.value, getCurrentTime() * 1000)

      const prevClipId =
        findLast(
          currentFileClipIds,
          clipId => (r.getClip(state, clipId) || { end: Infinity }).end <= x
        ) || currentFileClipIds[currentFileClipIds.length - 1]

      return prevClipId ? of(r.highlightClip(prevClipId)) : empty()
    })
  )

export default combineEpics(
  highlightEpic,
  highlightClipsOnAddEpic,
  playClipsOnHighlightEpic,
  selectClipOnStretch,
  centerSelectedClip,
  deselectOnOpenMediaFile,
  highlightRightEpic,
  highlightLeftEpic
)
