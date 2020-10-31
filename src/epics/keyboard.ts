import { filter, map, flatMap, switchMap, takeUntil } from 'rxjs/operators'
import { fromEvent, from, of, merge, empty } from 'rxjs'
import { combineEpics } from 'redux-observable'
import * as r from '../redux'
import * as A from '../types/ActionType'
import { KEYS } from '../utils/keyboard'
import { getMetaOrCtrlKey } from '../components/FlashcardSectionDisplayClozeField'
import { isTextFieldFocused } from '../utils/isTextFieldFocused'
import { KEY } from '../utils/dictionariesDatabase'

const keydownEpic: AppEpic = (action$, state$, effects) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    flatMap((event) => {
      const { shiftKey, ctrlKey, altKey, key } = event

      if (
        key.toLowerCase() === KEYS.lLowercase &&
        (ctrlKey || !isTextFieldFocused())
      )
        return of(r.toggleLoop('KEYBOARD'))

      if (
        key.toLowerCase() === KEYS.eLowercase &&
        !isTextFieldFocused() &&
        !(
          r.getHighlightedClipId(state$.value) &&
          r.isUserEditingCards(state$.value)
        )
      ) {
        event.preventDefault()
        return of(r.startEditingCards())
      }

      if (
        (key === KEYS.space || key === KEYS.process) &&
        (shiftKey || !isTextFieldFocused())
      ) {
        event.preventDefault()
        effects.toggleMediaPaused()
        return empty()
      }

      if (key === KEYS.arrowRight && (altKey || !isTextFieldFocused())) {
        return of(r.highlightRightClipRequest())
      }

      if (key === KEYS.arrowLeft && (altKey || !isTextFieldFocused())) {
        return of(r.highlightLeftClipRequest())
      }

      if (key === KEYS.escape) {
        if (r.getCurrentDialog(state$.value) || (window as any).cloze)
          return of(({ type: 'NOOP_ESC_KEY' } as unknown) as Action)

        if (
          r.getHighlightedClipId(state$.value) &&
          state$.value.session.editingCards
        )
          return from([
            ...(r.getLoopState(state$.value) ? [r.setLoop(false)] : []),
            r.stopEditingCards(),
          ])

        if (state$.value.session.dictionaryPopoverIsOpen) {
          return from([r.closeDictionaryPopover()])
        }

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

const saveKey = (window: Window) =>
  merge(
    fromEvent<KeyboardEvent>(window, 'keydown').pipe(
      filter((e) => {
        const { key } = e
        return key.toLowerCase() === KEYS.sLowercase && getMetaOrCtrlKey(e)
      })
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
