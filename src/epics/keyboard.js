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
import { fromEvent, from, of, empty, merge } from 'rxjs'
import { combineEpics } from 'redux-observable'
import * as r from '../redux'

const audioElement = () => document.getElementById('audioPlayer')

const spaceEpic = (action$, state$) =>
  fromEvent(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 32 && ctrlKey),
    tap(e => {
      e.preventDefault()
      const el = audioElement()
      if (el.paused) el.play()
      else el.pause()
      return { type: 'CTRL_SPACE' }
    }),
    ignoreElements()
  )

const ctrlRightBracket = (action$, state$) =>
  fromEvent(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 190 && ctrlKey),
    flatMap(e => {
      e.preventDefault()
      const media = audioElement()

      const state: AppState = state$.value
      const currentFileId = r.getCurrentFileId(state)
      if (!currentFileId) return empty()

      const currentFileClipIds = state.clips.idsByMediaFileId[currentFileId]

      const highlightedClipId = r.getHighlightedClipId(state)
      const nextIndex = currentFileClipIds.indexOf(highlightedClipId) + 1
      const lastIndex = currentFileClipIds.length - 1
      const nextId = currentFileClipIds[nextIndex > lastIndex ? 0 : nextIndex]
      if (highlightedClipId && nextId) return of(r.highlightClip(nextId))

      const x =
        media && r.getXAtMilliseconds(state$.value, media.currentTime * 1000)

      const nextClipId = currentFileClipIds.find(
        clipId => r.getClip(state, clipId).start >= x
      )

      return nextClipId ? of(r.highlightClip(nextClipId)) : empty()
    })
  )

const findLast = (array, predicate) => {
  if (!array.length) return null
  for (let i = array.length - 1; i >= 0; i -= 1) {
    const item = array[i]
    if (predicate(item)) return item
  }
}

const ctrlLeftBracket = (action$, state$) =>
  fromEvent(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 188 && ctrlKey),
    flatMap(e => {
      e.preventDefault()
      const media = audioElement()

      const state: AppState = state$.value
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
      const x =
        media && r.getXAtMilliseconds(state$.value, media.currentTime * 1000)

      const prevClipId =
        findLast(
          currentFileClipIds,
          clipId => r.getClip(state, clipId).end <= x
        ) || currentFileClipIds[currentFileClipIds.length - 1]

      return prevClipId ? of(r.highlightClip(prevClipId)) : empty()
    })
  )

const escEpic = (action$, state$) =>
  fromEvent(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 27),
    map(e => {
      return r.getCurrentDialog(state$.value)
        ? { type: 'NOOP_ESC_KEY' }
        : r.highlightClip(null)
    })
  )

const lEpic = (action$, state$) =>
  fromEvent(window, 'keydown').pipe(
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

      const media = audioElement()
      const x =
        media && r.getXAtMilliseconds(state$.value, media.currentTime * 1000)
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

const cmd = filter(({ keyCode }) => keyCode === 91)
const saveKey = merge(
  fromEvent(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 83 && ctrlKey) // ctrl + S
  ),
  fromEvent(window, 'keydown').pipe(
    cmd,
    switchMap(() =>
      fromEvent(window, 'keydown').pipe(
        filter(({ keyCode }) => keyCode === 83), // S
        takeUntil(fromEvent(window, 'keyup').pipe(cmd)),
        take(1)
      )
    )
  )
)

const saveEpic = (action$, state$) =>
  action$.ofType('OPEN_PROJECT').pipe(
    switchMap(() =>
      saveKey.pipe(
        map(({ shiftKey }) =>
          shiftKey ? r.saveProjectAsRequest() : r.saveProjectRequest()
        ),
        takeUntil(action$.ofType('CLOSE_PROJECT'))
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
