import { filter, map, mergeMap, switchMap, takeUntil } from 'rxjs/operators'
import { fromEvent, from, of, merge, EMPTY } from 'rxjs'
import { combineEpics } from 'redux-observable'
import r from '../redux'
import A from '../types/ActionType'
import { KEYS } from '../utils/keyboard'
import { getMetaOrCtrlKey } from '../components/FlashcardSectionDisplayClozeField'
import { isTextFieldFocused } from '../utils/isTextFieldFocused'
import os from 'os'

const playPauseForceKey = os.platform() === 'win32' ? 'ctrlKey' : 'shiftKey'

const keydownEpic: AppEpic = (action$, state$, effects) =>
  fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    mergeMap((event) => {
      const { ctrlKey, key } = event

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
        (event[playPauseForceKey] || !isTextFieldFocused())
      ) {
        event.preventDefault()
        if (
          !(
            document.activeElement &&
            document.activeElement === effects.getMediaPlayer()
          )
        )
          effects.toggleMediaPaused()
        return EMPTY
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

        const mediaIsPlaying = effects.isMediaPlaying()
        const currentTime = effects.getCurrentTime()

        if (
          mediaIsPlaying &&
          r.getClipIdAt(state$.value, currentTime * 1000) ===
            r.getHighlightedClipId(state$.value)
        )
          return of(r.setLoop(false))

        return EMPTY
      }

      if (key === KEYS.dUppercase && ctrlKey) {
        const highlightedClipId = r.getHighlightedClipId(state$.value)
        event.preventDefault()
        return highlightedClipId ? of(r.deleteCard(highlightedClipId)) : EMPTY
      }

      return EMPTY
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
  action$.ofType(A.openProject).pipe(
    switchMap(() =>
      saveKey(window).pipe(
        map(({ shiftKey }) =>
          shiftKey ? r.saveProjectAsRequest() : r.saveProjectRequest()
        ),
        takeUntil(action$.ofType(A.closeProject))
      )
    )
  )

export default combineEpics(keydownEpic, saveEpic)
