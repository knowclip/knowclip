import React, {
  useCallback,
  KeyboardEventHandler,
  useEffect,
  useState,
} from 'react'
import { getSelectionWithin, setSelectionRange } from './domSelection'
import * as r from '../../redux'
import { KEYS } from '../keyboard'
import { ClozeControls } from './useClozeControls'

export function useClozeUiEffects(
  clozeControls: ClozeControls,
  value: string,
  dispatch: any,
  dictionaryPopoverIsShowing: boolean,
  editing: boolean,
  isMediaPlaying: boolean,
  setWasLoopingBeforeFocus: React.Dispatch<React.SetStateAction<boolean>>,
  loopIsOn: boolean,
  wasLoopingBeforeFocus: boolean
) {
  const {
    clozeTextInputActions: { onBackspace, onPressDelete },
    inputRef: ref,
    cursorPosition,
    setCursorPosition,
  } = clozeControls

  const onKeyDown: KeyboardEventHandler<HTMLSpanElement> = useCallback(
    (e) => {
      switch (e.key) {
        case KEYS.arrowLeft: {
          const selection = getSelectionWithin(e.target as HTMLInputElement)
          const selectionMade = selection.end - selection.start !== 0
          if (selectionMade) {
            if (e.shiftKey) {
              break
            } else {
              setSelectionRange(
                e.target as HTMLSpanElement,
                selection.start,
                selection.start
              )

              setCursorPosition(selection.start)
              break
            }
          } else {
            if (e.shiftKey) {
              const start = cursorPosition == null ? 0 : cursorPosition - 1
              const end = cursorPosition == null ? 0 : cursorPosition

              setSelectionRange(e.target as HTMLSpanElement, start, end)
              e.preventDefault()
            } else
              setCursorPosition((cursorPosition) =>
                cursorPosition == null
                  ? cursorPosition
                  : Math.max(cursorPosition - 1, 0)
              )
          }
          break
        }
        case KEYS.arrowRight: {
          const selection = getSelectionWithin(e.target as HTMLSpanElement)
          const selectionMade = selection.end - selection.start !== 0
          if (selectionMade) {
            if (e.shiftKey) {
              break
            } else {
              setSelectionRange(
                e.target as HTMLSpanElement,
                selection.end,
                selection.end
              )
              setCursorPosition(selection.end)
              e.preventDefault()
              break
            }
          } else {
            if (e.shiftKey) {
              const start = cursorPosition == null ? 0 : cursorPosition
              const end = cursorPosition == null ? 0 : cursorPosition + 1

              console.log({ start, end })
              ref.current && setSelectionRange(ref.current, start, end)
              e.preventDefault()
            } else {
              setCursorPosition((cursorPosition) =>
                cursorPosition == null
                  ? cursorPosition
                  : Math.min(cursorPosition + 1, value.length)
              )
            }
          }
          break
        }

        case KEYS.delete: {
          const selection = getSelectionWithin(e.target as HTMLInputElement)
          const cursorPositionSelection = {
            start: cursorPosition || 0,
            end: cursorPosition || 0,
          }
          onPressDelete(
            selection.start === selection.end
              ? cursorPositionSelection
              : selection
          )
          e.preventDefault()
          break
        }
        case KEYS.backspace: {
          const selection = getSelectionWithin(e.target as HTMLInputElement)
          const cursorPositionSelection = {
            start: cursorPosition || 0,
            end: cursorPosition || 0,
          }
          onBackspace(
            selection.start === selection.end
              ? cursorPositionSelection
              : selection
          )
          e.preventDefault()
          break
        }
        case KEYS.escape:
          ;(e.target as HTMLSpanElement).blur()
          break
        case KEYS.eLowercase:
        case KEYS.eUppercase:
          dispatch(r.startEditingCards())
          e.preventDefault()
          break
        default:
      }
    },
    [
      dispatch,
      setCursorPosition,
      cursorPosition,
      ref,
      value.length,
      onPressDelete,
      onBackspace,
    ]
  )

  const handleFocus = useCallback(
    (e) => {
      if (!dictionaryPopoverIsShowing) {
        if (ref.current) {
          const selection = getSelectionWithin(ref.current)
          const currentlySelected = selection.end - selection.start !== 0
          if (!currentlySelected) setCursorPosition(0)
        }
        if (!editing && isMediaPlaying) {
          setWasLoopingBeforeFocus(loopIsOn)
          dispatch(r.setLoop(true))
        }
      }
    },
    [
      dictionaryPopoverIsShowing,
      ref,
      editing,
      isMediaPlaying,
      setCursorPosition,
      setWasLoopingBeforeFocus,
      loopIsOn,
      dispatch,
    ]
  )
  const handleBlur = useCallback(
    (e) => {
      if (!dictionaryPopoverIsShowing) {
        setCursorPosition(null)
        if (!editing && wasLoopingBeforeFocus !== loopIsOn)
          dispatch(r.setLoop(wasLoopingBeforeFocus))
      }
    },
    [
      dictionaryPopoverIsShowing,
      setCursorPosition,
      editing,
      wasLoopingBeforeFocus,
      loopIsOn,
      dispatch,
    ]
  )
  return { onKeyDown, handleFocus, handleBlur, cursorPosition }
}

export function useClozeCursorPosition(ref: React.RefObject<HTMLSpanElement>) {
  const [cursorPosition, setCursorPosition] = useState<number | null>(null)

  useEffect(() => {
    const onlyShowCursorWhenNoSelectionInClozeField = () => {
      if (ref.current) {
        if (document.activeElement !== ref.current)
          return setCursorPosition(null)

        const currentClozeSelection = getSelectionWithin(ref.current)

        const clozeSelectionCurrentlyMade =
          currentClozeSelection.end - currentClozeSelection.start !== 0
        const newPosition = clozeSelectionCurrentlyMade
          ? null
          : currentClozeSelection.end
        setCursorPosition(newPosition)
      }
    }
    document.addEventListener(
      'selectionchange',
      onlyShowCursorWhenNoSelectionInClozeField
    )
    return () =>
      document.removeEventListener(
        'selectionchange',
        onlyShowCursorWhenNoSelectionInClozeField
      )
  }, [ref])

  return { cursorPosition, setCursorPosition }
}
