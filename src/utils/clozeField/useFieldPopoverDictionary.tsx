import { SyntheticEvent, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ClozeControls } from './useClozeControls'
import { setSelectionRange } from './domSelection'
import r from '../../redux'
import { KEYS } from '../keyboard'
import {
  lookUpInDictionary,
  TranslatedTokensAtCharacterIndex,
} from '../dictionariesDatabase'
import { isTextFieldFocused } from '../isTextFieldFocused'
import usePopover from '../usePopover'
import { findTranslationsAtCharIndex } from '../dictionaries/findTranslationsAtCharIndex'
import { usePrevious } from '../usePrevious'
import { useClozeUiEffects } from './useClozeUiEffects'
import { LETTERS_DIGITS_PLUS } from '../dictCc'
import { getMousePosition } from '../mousePosition'

function getMouseoverChar(mousePosition: [number, number] | null) {
  if (!mousePosition) return null

  const mouseoverCharSpan = document.elementFromPoint(...mousePosition)
  if (
    mouseoverCharSpan &&
    mouseoverCharSpan.tagName === 'SPAN' &&
    (mouseoverCharSpan as HTMLSpanElement).dataset.characterIndex
  )
    return mouseoverCharSpan as HTMLSpanElement
  else return null
}

export function useFieldPopoverDictionary(
  popover: ReturnType<typeof usePopover>,
  activeDictionaryType: DictionaryFileType | null,
  clozeControls: ClozeControls,
  value: string,
  editing: boolean
) {
  const { inputRef: ref } = clozeControls
  const dispatch = useDispatch()
  const { isMediaPlaying, loopState, popoverIsOpenFromStore } = useSelector(
    (state: AppState) => ({
      isMediaPlaying: r.isMediaPlaying(state),
      loopState: r.getLoopState(state),
      popoverIsOpenFromStore: state.session.dictionaryPopoverIsOpen,
    })
  )
  const dictionaryPopoverIsShowing = Boolean(
    popover.isOpen && activeDictionaryType
  )

  const previousPopoverIsOpen = usePrevious(popover.isOpen)

  useEffect(() => {
    dispatch(
      popover.isOpen ? r.openDictionaryPopover() : r.closeDictionaryPopover()
    )
  }, [popover.isOpen, dispatch])
  const { close: closePopover } = popover

  // loop when using dictionary
  useEffect(() => {
    const openingPopover = popover.isOpen && !previousPopoverIsOpen
    if (openingPopover && !editing && isMediaPlaying) {
      dispatch(r.setLoop('FOCUS'))
    }
  }, [
    isMediaPlaying,
    popover.isOpen,
    editing,
    previousPopoverIsOpen,
    loopState,
    dispatch,
  ])

  const popoverWasOpen = usePrevious(popover.isOpen)

  useEffect(() => {
    const closingPopover = popoverWasOpen && !popover.isOpen
    if (closingPopover) {
      if (isMediaPlaying && !editing && loopState === 'FOCUS') {
        dispatch(r.setLoop(false))
      }
    }
  }, [
    dispatch,
    editing,
    isMediaPlaying,
    loopState,
    popover.isOpen,
    popoverWasOpen,
  ])

  useEffect(() => {
    if (popoverWasOpen && popover.isOpen && !popoverIsOpenFromStore) {
      closePopover({} as SyntheticEvent)
    }
  }, [
    popoverWasOpen,
    popover.isOpen,
    popoverIsOpenFromStore,
    closePopover,
    isMediaPlaying,
    editing,
    loopState,
    dispatch,
  ])

  const { anchorCallbackRef } = popover

  const [tokenTranslations, setTokenTranslations] = useState<
    TranslatedTokensAtCharacterIndex[]
  >([])
  const [translationsAtCharacter, setTranslationsAtCharacter] =
    useState<TranslatedTokensAtCharacterIndex | null>(null)

  const { onKeyDown, handleFocus, handleBlur, cursorPosition } =
    useClozeUiEffects(
      clozeControls,
      value,
      dispatch,
      dictionaryPopoverIsShowing,
      editing,
      isMediaPlaying,
      loopState
    )

  useEffect(() => {
    if (activeDictionaryType) {
      lookUpInDictionary(activeDictionaryType, value).then(
        ({ tokensTranslations }) => {
          setTokenTranslations(tokensTranslations)
        }
      )
    } else {
      setTokenTranslations([])
    }
  }, [value, activeDictionaryType])

  const [mouseoverChar, setMouseoverChar] = useState<HTMLSpanElement | null>(
    null
  )
  useEffect(() => {
    const mouseoverCharSpan = getMouseoverChar(getMousePosition())

    setMouseoverChar(mouseoverCharSpan)
    anchorCallbackRef(mouseoverCharSpan)

    const trackCursor = (e: MouseEvent) => {
      const mouseoverCharSpan = getMouseoverChar([e.clientX, e.clientY])
      if (mouseoverCharSpan) {
        setMouseoverChar(mouseoverCharSpan)
        anchorCallbackRef(mouseoverCharSpan)
      }
    }
    document.addEventListener('mousemove', trackCursor)
    return () => document.removeEventListener('mousemove', trackCursor)
  }, [anchorCallbackRef])

  // show popup on press D
  useEffect(() => {
    const showDictionaryPopup = (e: KeyboardEvent) => {
      const dKey =
        ref.current && (e.key === KEYS.dLowercase || e.key === KEYS.dUppercase)

      if (
        dKey &&
        (!isTextFieldFocused() || ref.current === document.activeElement)
      ) {
        if (mouseoverChar) {
          popover.open(e as any)
        } else if (!activeDictionaryType) {
          return dispatch(r.activateDictionaryPromptSnackbar())
        }
      }
    }
    document.addEventListener('keydown', showDictionaryPopup)
    return () => document.removeEventListener('keydown', showDictionaryPopup)
  }, [
    activeDictionaryType,
    dispatch,
    mouseoverChar,
    popover,
    ref,
    tokenTranslations,
    tokenTranslations.length,
  ])

  // update popup dictionary contents
  useEffect(() => {
    if (popover.isOpen && mouseoverChar && !editing) {
      const mouseCharIndex =
        mouseoverChar &&
        mouseoverChar.dataset &&
        !isNaN(+(mouseoverChar.dataset.characterIndex || ''))
          ? +(mouseoverChar.dataset.characterIndex || '')
          : -1
      console.log(mouseoverChar.dataset.characterIndex, mouseCharIndex)
      const translationsAtCharacter = mouseoverChar?.dataset
        ? findTranslationsAtCharIndex(tokenTranslations, mouseCharIndex)
        : null

      const nonwordMouseenter =
        !translationsAtCharacter &&
        !LETTERS_DIGITS_PLUS.test(value[mouseCharIndex])
      if (!nonwordMouseenter) {
        setTranslationsAtCharacter(translationsAtCharacter)
      }
      if (translationsAtCharacter && mouseCharIndex !== -1) {
        setSelectionRange(
          ref.current as HTMLElement,
          translationsAtCharacter.textCharacterIndex,
          translationsAtCharacter.textCharacterIndex +
            translationsAtCharacter.translatedTokens[0].matchedTokenText.length
        )
      }
    }
  }, [popover.isOpen, mouseoverChar, tokenTranslations, ref, editing, value])

  return {
    cursorPosition,
    translationsAtCharacter,
    onKeyDown,
    handleFocus,
    handleBlur,
  }
}
