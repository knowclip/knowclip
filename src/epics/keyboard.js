import { filter, map, flatMap, tap, ignoreElements } from 'rxjs/operators'
import { fromEvent, from, of } from 'rxjs'
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

export default combineEpics(spaceEpic, escEpic, lEpic)
