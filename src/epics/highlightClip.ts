import { map, ignoreElements, filter, tap, switchMap } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { empty, of } from 'rxjs'
import * as r from '../redux'

const elementWidth = (element: Element) => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}

const selectClipOnStretch: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, EditClip>(A.EDIT_CLIP),
    filter(({ override }) => {
      const isStretch =
        override && (override.start !== undefined || override.end !== undefined)
      return Boolean(isStretch)
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
  { getWaveformSvgElement, getCurrentTime }
) =>
  action$.pipe(
    ofType<Action, SelectWaveformItem>(A.SELECT_WAVEFORM_ITEM),
    switchMap(action => {
      const selection = r.getWaveformSelection(state$.value)
      const clip = selection && selection.item

      if (!(window as any).seeking) return empty()

      if (!clip) return empty()
      const svgElement = getWaveformSvgElement()
      if (!svgElement) return empty()
      const svgWidth = elementWidth(svgElement)

      const svgFits = clip.end - clip.start <= svgWidth
      if (!svgFits) return empty()

      const { waveform } = state$.value
      const { xMin } = waveform.viewBox

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
            xMin: Math.min(
              clip.end + HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER - svgWidth,
              waveform.length - svgWidth
            ),
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
      const waveformItems = r.getWaveformItems(state)
      const selection = r.getWaveformSelection(state)
      const currentIndex = selection ? selection.index : -1
      const nextIndex = currentIndex !== -1 ? currentIndex + 1 : -1
      if (selection && nextIndex !== -1) {
        const lastIndex = waveformItems.length - 1
        const next = waveformItems[nextIndex > lastIndex ? 0 : nextIndex]
        if (next)
          return setCurrentTime(
            r.getSecondsAtX(
              state$.value,
              Math.max(next.item.start, selection.item.end + 1)
            )
          )
      }

      const x = r.getXAtMilliseconds(state$.value, getCurrentTime() * 1000)

      const next =
        waveformItems.find(({ item }) => item.start >= x) || waveformItems[0]

      if (next) setCurrentTime(r.getSecondsAtX(state$.value, next.item.start))
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

      const waveformItems = r.getWaveformItems(state)
      const selection = r.getWaveformSelection(state)

      if (selection) {
        const highlightedIndex = selection.index
        const prev =
          waveformItems[
            highlightedIndex === 0
              ? waveformItems.length - 1
              : highlightedIndex - 1
          ]

        if (prev)
          return setCurrentTime(r.getSecondsAtX(state$.value, prev.item.start))
      }
      const x = r.getXAtMilliseconds(state$.value, getCurrentTime() * 1000)

      const prev =
        findLast(waveformItems, ({ item }) => item.end <= x) ||
        waveformItems[waveformItems.length - 1]

      if (prev) setCurrentTime(r.getSecondsAtX(state$.value, prev.item.start))
    }),
    ignoreElements()
  )

export default combineEpics(
  selectClipOnStretch,
  centerSelectedClip,
  deselectOnOpenMediaFile,
  highlightRightEpic,
  highlightLeftEpic
)
