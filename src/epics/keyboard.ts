import {
  filter,
  map,
  flatMap,
  tap,
  ignoreElements,
  switchMap,
  takeUntil,
  take,
} from 'rxjs/operators'
import { fromEvent, from, of, empty, merge, OperatorFunction } from 'rxjs'
import { combineEpics } from 'redux-observable'
import * as r from '../redux'
import { AppEpic } from '../flow/AppEpic'

const spaceEpic: AppEpic = (action$, state$, { window, toggleMediaPaused }) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 32 && ctrlKey),
    tap(e => {
      e.preventDefault()
      toggleMediaPaused()
      return { type: 'CTRL_SPACE' }
    }),
    ignoreElements()
  )

const ctrlRightBracket: AppEpic = (
  action$,
  state$,
  { window, getCurrentTime }
) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 190 && ctrlKey),
    flatMap(e => {
      e.preventDefault()

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

const ctrlLeftBracket: AppEpic = (
  action$,
  state$,
  { window, getCurrentTime }
) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 188 && ctrlKey),
    flatMap(e => {
      e.preventDefault()

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

const escEpic: AppEpic = (action$, state$, { window }) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 27),
    map(e => {
      return r.getCurrentDialog(state$.value)
        ? (({ type: 'NOOP_ESC_KEY' } as unknown) as Action)
        : r.highlightClip(null)
    })
  )

const lEpic: AppEpic = (action$, state$, { window, getCurrentTime }) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 76 && ctrlKey),
    flatMap(e => {
      //
      //
      //
      //
      //
      //
      //
      //
      //

      const x = r.getXAtMilliseconds(state$.value, getCurrentTime() * 1000)
      const clipIdAtX = r.getClipIdAt(state$.value, x)
      const highlightedId = r.getHighlightedClipId(state$.value)

      if (r.isLoopOn(state$.value) && clipIdAtX && !highlightedId)
        return of(r.highlightClip(clipIdAtX))

      if (clipIdAtX && highlightedId !== clipIdAtX)
        return from([r.highlightClip(clipIdAtX), r.toggleLoop()])
      //
      //
      //
      //
      //
      //
      //
      //

      return of(r.toggleLoop())
    })
  )

const cmd: OperatorFunction<KeyboardEvent, KeyboardEvent> = filter(
  ({ keyCode }) => keyCode === 91
)
const saveKey = (window: Window) =>
  merge(
    fromEvent<KeyboardEvent>(window, 'keydown').pipe(
      filter(({ ctrlKey, keyCode }) => keyCode === 83 && ctrlKey) // ctrl + S
    ),
    fromEvent<KeyboardEvent>(window, 'keydown').pipe(
      cmd,
      switchMap(() =>
        fromEvent<KeyboardEvent>(window, 'keydown').pipe(
          filter(({ keyCode }) => keyCode === 83), // S
          takeUntil(fromEvent<KeyboardEvent>(window, 'keyup').pipe(cmd)),
          take(1)
        )
      )
    )
  )

const saveEpic: AppEpic = (action$, state$, { window }) =>
  action$.ofType(A.OPEN_PROJECT).pipe(
    switchMap(() =>
      saveKey(window).pipe(
        map(({ shiftKey }) =>
          shiftKey ? r.saveProjectAsRequest() : r.saveProjectRequest()
        ),
        takeUntil(action$.ofType(A.CLOSE_PROJECT))
      )
    )
  )

export default combineEpics(
  spaceEpic,
  escEpic,
  lEpic,
  ctrlRightBracket,
  ctrlLeftBracket,
  saveEpic
)
