import { SyntheticEvent, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ClozeControls } from './useClozeControls'
import { setSelectionRange } from './domSelection'
import * as r from '../../redux'
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
  const { isMediaPlaying, loopIsOn, popoverIsOpenFromStore } = useSelector(
    (state: AppState) => ({
      isMediaPlaying: r.isMediaPlaying(state),
      loopIsOn: r.isLoopOn(state),
      popoverIsOpenFromStore: state.session.dictionaryPopoverIsOpen,
    })
  )
  const dictionaryPopoverIsShowing = Boolean(
    popover.isOpen && activeDictionaryType
  )

  const previousPopoverIsOpen = usePrevious(popover.isOpen)
  const [wasLoopingBeforeFocus, setWasLoopingBeforeFocus] = useState(false)

  useEffect(
    () => {
      dispatch(
        popover.isOpen ? r.openDictionaryPopover() : r.closeDictionaryPopover()
      )
    },
    [popover.isOpen, dispatch]
  )
  const { close: closePopover } = popover

  // loop when using dictionary
  useEffect(
    () => {
      if (
        popover.isOpen &&
        !previousPopoverIsOpen &&
        !editing &&
        isMediaPlaying
      ) {
        console.log('looping now!', { loopIsOn })
        setWasLoopingBeforeFocus(loopIsOn)
        dispatch(r.setLoop(true))
      }
    },
    [
      isMediaPlaying,
      popover.isOpen,
      editing,
      previousPopoverIsOpen,
      loopIsOn,
      dispatch,
      setWasLoopingBeforeFocus,
    ]
  )

  const popoverWasOpen = usePrevious(popover.isOpen)

  useEffect(
    () => {
      if (popoverWasOpen && !popover.isOpen) {
        console.log('closed popover!')
        if (isMediaPlaying && !editing && wasLoopingBeforeFocus !== loopIsOn) {
          console.log('unlooping now!', { wasLoopingBeforeFocus })
          dispatch(r.setLoop(wasLoopingBeforeFocus))
        }
      }
    },
    [
      dispatch,
      editing,
      isMediaPlaying,
      loopIsOn,
      popover.isOpen,
      popoverWasOpen,
      wasLoopingBeforeFocus,
    ]
  )

  useEffect(
    () => {
      console.log({ popoverIsOpenFromStore })
      if (popoverWasOpen && popover.isOpen && !popoverIsOpenFromStore) {
        console.log('closing popover due to redux signal')

        if (
          isMediaPlaying &&
          // dictionaryPopoverIsShowing &&
          !editing &&
          wasLoopingBeforeFocus !== loopIsOn
        ) {
          console.log('unlooping now!', { wasLoopingBeforeFocus })
          dispatch(r.setLoop(wasLoopingBeforeFocus))
        }

        closePopover({} as SyntheticEvent)
      }
    },
    [
      popoverWasOpen,
      popover.isOpen,
      popoverIsOpenFromStore,
      closePopover,
      isMediaPlaying,
      editing,
      wasLoopingBeforeFocus,
      loopIsOn,
      dispatch,
    ]
  )

  const { anchorCallbackRef } = popover

  const [tokenTranslations, setTokenTranslations] = useState<
    TranslatedTokensAtCharacterIndex[]
  >([])
  const [
    translationsAtCharacter,
    setTranslationsAtCharacter,
  ] = useState<TranslatedTokensAtCharacterIndex | null>(null)

  const {
    onKeyDown,
    handleFocus,
    handleBlur,
    cursorPosition,
  } = useClozeUiEffects(
    clozeControls,
    value,
    dispatch,
    dictionaryPopoverIsShowing,
    editing,
    isMediaPlaying,
    setWasLoopingBeforeFocus,
    loopIsOn,
    wasLoopingBeforeFocus
  )

  useEffect(
    () => {
      if (activeDictionaryType) {
        lookUpInDictionary(activeDictionaryType, value).then(
          ({ tokensTranslations }) => {
            console.log('new value lookup done!', { tokensTranslations })
            setTokenTranslations(tokensTranslations)
          }
        )
      } else {
        console.log('not parsing anymore!')
        setTokenTranslations([])
      }
    },
    [value, activeDictionaryType]
  )

  const [mouseoverChar, setMouseoverChar] = useState<HTMLSpanElement | null>(
    null
  )
  useEffect(
    () => {
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
    },
    [anchorCallbackRef]
  )

  // show popup on press D
  useEffect(
    () => {
      const showDictionaryPopup = (e: KeyboardEvent) => {
        const dKey =
          ref.current &&
          (e.key === KEYS.dLowercase || e.key === KEYS.dUppercase)

        if (
          dKey &&
          (!isTextFieldFocused() || ref.current === document.activeElement)
        ) {
          if (!activeDictionaryType) {
            return dispatch(
              r.simpleMessageSnackbar(
                'Select a dictionary in settings menu to enable word lookup.'
              )
            )
          }

          if (mouseoverChar) {
            popover.open(e as any)
          }
        }
      }
      document.addEventListener('keydown', showDictionaryPopup)
      return () => document.removeEventListener('keydown', showDictionaryPopup)
    },
    [
      activeDictionaryType,
      dispatch,
      mouseoverChar,
      popover,
      ref,
      tokenTranslations,
      tokenTranslations.length,
    ]
  )

  // update popup dictionary contents
  useEffect(
    () => {
      if (popover.isOpen && mouseoverChar && !editing) {
        console.log(mouseoverChar ? mouseoverChar.dataset : 'no mouseover char')
        const mouseCharIndex =
          mouseoverChar &&
          mouseoverChar.dataset &&
          !isNaN(+(mouseoverChar.dataset.characterIndex || ''))
            ? +(mouseoverChar.dataset.characterIndex || '')
            : -1
        const translationsAtCharacter =
          mouseoverChar && mouseoverChar.dataset
            ? findTranslationsAtCharIndex(tokenTranslations, mouseCharIndex)
            : null

        const nonwordMouseenter =
          !translationsAtCharacter &&
          !LETTERS_DIGITS_PLUS.test(value[mouseCharIndex])
        console.log({ nonwordMouseenter }, value[mouseCharIndex])
        if (!nonwordMouseenter) {
          setTranslationsAtCharacter(translationsAtCharacter)
        }
        if (translationsAtCharacter && mouseCharIndex !== -1) {
          setSelectionRange(
            ref.current as HTMLElement,
            translationsAtCharacter.textCharacterIndex,
            translationsAtCharacter.textCharacterIndex +
              translationsAtCharacter.translatedTokens[0].matchedTokenText
                .length
          )
        }
      }
    },
    [popover.isOpen, mouseoverChar, tokenTranslations, ref, editing, value]
  )

  return {
    cursorPosition,
    translationsAtCharacter,
    onKeyDown,
    handleFocus,
    handleBlur,
  }
}
