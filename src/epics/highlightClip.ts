import { map, ignoreElements, filter, tap, switchMap } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { empty, of } from 'rxjs'
import * as r from '../redux'

const elementWidth = (element: Element) => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}

const highlightClipsOnAddEpic: AppEpic = action$ =>
  action$.pipe(
    ofType<Action, AddClip>(A.ADD_CLIP),
    map(({ clip: { id } }) => r.highlightClip(id))
  )

const selectClipOnStretch: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, EditClip>(A.EDIT_CLIP),
    filter(({ override }) => {
      const isStretch =
        override.start !== undefined || override.end !== undefined
      return isStretch
    }),
    tap(({ id }) => {
      const clip = r.getClip(state$.value, id)
      if (clip)
        effects.setCurrentTime(r.getSecondsAtX(state$.value, clip.start))
    }),
    ignoreElements()
  )

const HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER = 100
const centerSelectedClip: AppEpic = (
  action$,
  state$,
  { getWaveformSvgElement }
) =>
  action$.pipe(
    ofType<Action, SelectWaveformItem>(A.SELECT_WAVEFORM_ITEM),
    switchMap(action => {
      const id =
        action.selection &&
        action.selection.type === 'Clip' &&
        action.selection.id
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

const deselectOnOpenMediaFile: AppEpic = action$ =>
  action$.pipe(
    ofType<Action, OpenFileRequest>(A.OPEN_FILE_REQUEST),
    filter(({ file }) => file.type === 'MediaFile'),
    map(() => r.clearWaveformSelection())
  )

const highlightRightEpic: AppEpic = (
  action$,
  state$,
  { getCurrentTime, setCurrentTime }
) =>
  action$.pipe(
    ofType<Action, HighlightRightClipRequest>(A.HIGHLIGHT_RIGHT_CLIP_REQUEST),
    tap(() => {
      const state = state$.value
      const currentFileId = r.getCurrentFileId(state)
      if (!currentFileId) return empty()

      const currentFileClipIds = state.clips.idsByMediaFileId[currentFileId]

      const highlightedClipId = r.getHighlightedClipId(state)
      if (highlightedClipId) {
        const nextIndex = currentFileClipIds.indexOf(highlightedClipId) + 1
        const lastIndex = currentFileClipIds.length - 1
        const nextId = currentFileClipIds[nextIndex > lastIndex ? 0 : nextIndex]
        const next = r.getClip(state$.value, nextId)
        if (next) setCurrentTime(r.getSecondsAtX(state$.value, next.start))
        return
      }

      const x = r.getXAtMilliseconds(state$.value, getCurrentTime() * 1000)

      const nextClipId = currentFileClipIds.find(
        clipId => (r.getClip(state, clipId) || { start: 0 }).start >= x
      )

      const next = nextClipId && r.getClip(state$.value, nextClipId)
      if (next) setCurrentTime(r.getSecondsAtX(state$.value, next.start))
    }),
    ignoreElements()
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
  { getCurrentTime, setCurrentTime }
) =>
  action$.pipe(
    ofType<Action, HighlightLeftClipRequest>(A.HIGHLIGHT_LEFT_CLIP_REQUEST),
    tap(() => {
      const state = state$.value
      const currentFileId = r.getCurrentFileId(state)
      if (!currentFileId) return

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

        const next = r.getClip(state$.value, nextId)
        if (next) setCurrentTime(r.getSecondsAtX(state$.value, next.start))
        return
      }
      const x = r.getXAtMilliseconds(state$.value, getCurrentTime() * 1000)

      const prevClipId =
        findLast(
          currentFileClipIds,
          clipId => (r.getClip(state, clipId) || { end: Infinity }).end <= x
        ) || currentFileClipIds[currentFileClipIds.length - 1]

      const previous = r.getClip(state$.value, prevClipId)
      if (previous)
        setCurrentTime(r.getSecondsAtX(state$.value, previous.start))
    }),
    ignoreElements()
  )

export default combineEpics(
  // highlightEpic,
  highlightClipsOnAddEpic,
  // playClipsOnHighlightEpic,
  selectClipOnStretch,
  centerSelectedClip,
  deselectOnOpenMediaFile,
  highlightRightEpic,
  highlightLeftEpic
)
