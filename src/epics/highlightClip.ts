import { map, ignoreElements, filter, tap, switchMap } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { EMPTY, of, merge } from 'rxjs'
import A from '../types/ActionType'
import r from '../redux'

const elementWidth = (element: Element) => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}

const selectClipOnStretch: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType<Action, EditClip>(A.editClip),
    filter(({ override }) => {
      const isStretch =
        override && (override.start !== undefined || override.end !== undefined)
      return Boolean(isStretch)
    }),
    tap(({ id }) => {
      const clip = r.getClip(state$.value, id)
      if (clip) effects.setCurrentTime(r.getSecondsAtX(clip.start))
    }),
    ignoreElements()
  )

const HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER = 100
const centerSelectedClip: AppEpic = (
  action$,
  state$,
  { getWaveformSvgElement }
) =>
  merge(
    action$.pipe(
      ofType<Action, SelectWaveformItem>(A.selectWaveformItem),
      switchMap(() => {
        const selection = r.getWaveformSelection(state$.value)
        const clip = selection && selection.item
        return clip && (window as any).seeking ? of(clip) : EMPTY
      })
    ),
    action$.ofType<EditClip>(A.editClip).pipe(
      switchMap((action) => {
        if (
          action.override &&
          ('start' in action.override || 'end' in action.override)
        ) {
          const clip = r.getHighlightedClip(state$.value)
          return clip ? of(clip) : EMPTY
        }

        return EMPTY
      })
    ),
    action$.ofType<MergeClips>(A.mergeClips).pipe(
      switchMap((action) => {
        if (action.newSelection && action.newSelection.type === 'Clip') {
          const clip = r.getClip(state$.value, action.newSelection.id)
          return clip ? of(clip) : EMPTY
        }

        return EMPTY
      })
    )
  ).pipe(
    switchMap((clip) => {
      const svgElement = getWaveformSvgElement()
      if (!svgElement) return EMPTY
      const svgWidth = elementWidth(svgElement)

      const svgFits = clip.end - clip.start <= svgWidth
      if (!svgFits) return EMPTY

      // const { waveform } = state$.value
      // const { xMin } = waveform.viewBox

      // if (clip.start - xMin < HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER)
      //   return of(
      //     r.setWaveformViewBox({
      //       xMin: Math.max(
      //         0,
      //         clip.start - HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER
      //       ),
      //     })
      //   )

      // if (xMin + svgWidth - clip.end < HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER)
      //   return of(
      //     r.setWaveformViewBox({
      //       xMin: Math.min(
      //         clip.end + HIGHLIGHTED_CLIP_TO_WAVEFORM_EDGE_BUFFER - svgWidth,
      //         waveform.length - svgWidth
      //       ),
      //     })
      //   )

      return EMPTY
    })
  )

const deselectOnOpenMediaFile: AppEpic = (action$) =>
  action$.pipe(
    ofType<Action, OpenFileRequest>(A.openFileRequest),
    filter(({ file }) => file.type === 'MediaFile'),
    map(() => r.clearWaveformSelection())
  )

const highlightRightEpic: AppEpic = (
  action$,
  state$,
  { getCurrentTime, setCurrentTime }
) =>
  action$.pipe(
    ofType<Action, HighlightRightClipRequest>(A.highlightRightClipRequest),
    switchMap(() => {
      const state = state$.value
      const currentFileId = r.getCurrentFileId(state)
      if (!currentFileId) return EMPTY
      const waveformItems = r.getWaveformItems(state)
      const selection = r.getWaveformSelection(state)
      const currentIndex = selection ? selection.index : -1
      const nextIndex = currentIndex !== -1 ? currentIndex + 1 : -1
      if (selection && nextIndex !== -1) {
        const lastIndex = waveformItems.length - 1
        const next = waveformItems[nextIndex > lastIndex ? 0 : nextIndex]

        if (next) {
          setCurrentTime(
            r.getSecondsAtX(Math.max(next.item.start, selection.item.end + 1))
          )
          return r.isMediaFileLoaded(state)
            ? EMPTY
            : of(r.selectWaveformItem(next))
        }
      }

      const x = r.getXAtMilliseconds(getCurrentTime() * 1000)

      const next =
        waveformItems.find(({ item }) => item.start >= x) || waveformItems[0]
      if (next) {
        setCurrentTime(r.getSecondsAtX(next.item.start))
        return r.isMediaFileLoaded(state)
          ? EMPTY
          : of(r.selectWaveformItem(next))
      }

      return EMPTY
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
  { getCurrentTime, setCurrentTime }
) =>
  action$.pipe(
    ofType<Action, HighlightLeftClipRequest>(A.highlightLeftClipRequest),
    switchMap(() => {
      const state = state$.value
      const currentFileId = r.getCurrentFileId(state)
      if (!currentFileId) return EMPTY

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

        if (prev) {
          setCurrentTime(r.getSecondsAtX(prev.item.start))
          return r.isMediaFileLoaded(state)
            ? EMPTY
            : of(r.selectWaveformItem(prev))
        }
      }
      const x = r.getXAtMilliseconds(getCurrentTime() * 1000)

      const prev =
        findLast(waveformItems, ({ item }) => item.end <= x) ||
        waveformItems[waveformItems.length - 1]

      if (prev) {
        setCurrentTime(r.getSecondsAtX(prev.item.start))
        return r.isMediaFileLoaded(state)
          ? EMPTY
          : of(r.selectWaveformItem(prev))
      }

      return EMPTY
    })
  )

export default combineEpics(
  selectClipOnStretch,
  centerSelectedClip,
  deselectOnOpenMediaFile,
  highlightRightEpic,
  highlightLeftEpic
)
