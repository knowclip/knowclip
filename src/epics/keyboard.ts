import {
  filter,
  map,
  flatMap,
  switchMap,
  takeUntil,
  take,
} from 'rxjs/operators'
import { fromEvent, from, of, merge, OperatorFunction, empty } from 'rxjs'
import { combineEpics } from 'redux-observable'
import * as r from '../redux'

const isTextFieldFocused = () => {
  const { activeElement } = document
  if (!activeElement) return false
  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLDivElement ||
    activeElement instanceof HTMLSpanElement
  )
}

const keydownEpic: AppEpic = (action$, state$, effects) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    flatMap(event => {
      const { ctrlKey, altKey, keyCode } = event

      // L key
      if (keyCode === 76 && (ctrlKey || !isTextFieldFocused()))
        return of(r.toggleLoop())

      // E key
      if (
        keyCode === 69 &&
        !isTextFieldFocused() &&
        !(
          r.getHighlightedClipId(state$.value) &&
          r.isUserEditingCards(state$.value)
        )
      ) {
        event.preventDefault()
        return of(r.startEditingCards())
      }

      // space
      if (keyCode === 32 && (ctrlKey || !document.activeElement)) {
        event.preventDefault()
        const activeElement = window.document.activeElement
        if (
          !(activeElement && ['VIDEO', 'AUDIO'].includes(activeElement.tagName))
        )
          effects.toggleMediaPaused()
        return empty()
      }
      // right arrow
      if (keyCode === 39 && (altKey || !isTextFieldFocused())) {
        return of(r.highlightRightClipRequest())
      }

      // left arrow
      if (keyCode === 37 && (altKey || !isTextFieldFocused())) {
        return of(r.highlightLeftClipRequest())
      }

      // esc
      if (keyCode === 27) {
        if (r.getCurrentDialog(state$.value))
          of(({ type: 'NOOP_ESC_KEY' } as unknown) as Action)

        if (
          r.getHighlightedClipId(state$.value) &&
          state$.value.session.editingCards
        )
          return from([
            ...(r.isLoopOn(state$.value) ? [r.setLoop(false)] : []),
            r.stopEditingCards(),
          ])

        return of(
          effects.isMediaPlaying()
            ? r.getClipIdAt(state$.value, state$.value.waveform.cursor.x) ===
              r.getHighlightedClipId(state$.value)
              ? r.setLoop(false)
              : r.clearWaveformSelection()
            : r.clearWaveformSelection()
        )
      }

      return empty()
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

export default combineEpics(keydownEpic, saveEpic)
