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
import { fromEvent, from, of, merge, OperatorFunction } from 'rxjs'
import { combineEpics } from 'redux-observable'
import * as r from '../redux'

const ctrlSpaceEpic: AppEpic = (
  action$,
  state$,
  { window, toggleMediaPaused }
) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 32 && ctrlKey),
    tap(e => {
      e.preventDefault()
      const activeElement = window.document.activeElement
      if (
        !(activeElement && ['VIDEO', 'AUDIO'].includes(activeElement.tagName))
      )
        toggleMediaPaused()
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
    map(() => r.highlightRightClipRequest())
  )

const ctrlLeftBracket: AppEpic = (
  action$,
  state$,
  { window, getCurrentTime }
) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 188 && ctrlKey),
    map(() => r.highlightLeftClipRequest())
  )

const escEpic: AppEpic = (action$, state$, { window, isMediaPlaying }) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    filter(({ ctrlKey, keyCode }) => keyCode === 27),
    flatMap(e => {
      if (r.getCurrentDialog(state$.value))
        of(({ type: 'NOOP_ESC_KEY' } as unknown) as Action)

      if (
        r.getHighlightedClipId(state$.value) &&
        state$.value.session.editingCards
      )
        return of(r.stopEditingCards())

      return of(
        isMediaPlaying()
          ? r.getClipIdAt(state$.value, state$.value.waveform.cursor.x) ===
            r.getHighlightedClipId(state$.value)
            ? r.setLoop(false)
            : r.clearWaveformSelection()
          : r.clearWaveformSelection()
      )
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
  ctrlSpaceEpic,
  escEpic,
  lEpic,
  ctrlRightBracket,
  ctrlLeftBracket,
  saveEpic
)
