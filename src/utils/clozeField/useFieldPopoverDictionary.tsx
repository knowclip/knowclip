import { useCallback, useEffect, useState } from 'react'
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

export function useFieldPopoverDictionary(
  popover: ReturnType<typeof usePopover>,
  activeDictionaryType: DictionaryFileType | null,
  clozeTextInputActions: ClozeControls['clozeTextInputActions'],
  ref: ClozeControls['inputRef'],
  value: string,
  editing: boolean
) {
  const dispatch = useDispatch()
  const { isMediaPlaying, loopIsOn } = useSelector((state: AppState) => ({
    isMediaPlaying: r.isMediaPlaying(state),
    loopIsOn: r.isLoopOn(state),
  }))
  const dictionaryPopoverIsShowing = Boolean(
    popover.isOpen && activeDictionaryType
  )

  const [wasLoopingBeforeFocus, setWasLoopingBeforeFocus] = useState(false)

  const [tokenTranslations, setTokenTranslations] = useState<
    TranslatedTokensAtCharacterIndex[]
  >([])
  const [translationsAtCharacter, setTranslationsAtCharacter] = useState<
    ReturnType<typeof findTranslationsAtCharIndex>
  >([])

  const {
    onKeyDown,
    handleFocus,
    handleBlur,
    cursorPosition,
  } = useClozeUiEffects(
    clozeTextInputActions,
    ref,
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
  const { anchorCallbackRef } = popover
  const handleCharMouseEnter_ = useCallback(
    (characterIndex: number, charSpanRef: HTMLSpanElement | null) => {
      setMouseoverChar(charSpanRef)
      anchorCallbackRef(charSpanRef)
      return
    },
    [anchorCallbackRef]
  )
  const handleCharMouseEnter = activeDictionaryType
    ? handleCharMouseEnter_
    : undefined
  const handleMouseLeave = useCallback(() => {
    // setTokenHit([])
    // popover.anchorCallbackRef(null)
  }, [])

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

          popover.open(e as any)
        }
      }
      document.addEventListener('keydown', showDictionaryPopup)
      return () => document.removeEventListener('keydown', showDictionaryPopup)
    },
    [
      activeDictionaryType,
      dispatch,
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
            : []
        console.log(
          { tokenHit: translationsAtCharacter },
          mouseoverChar &&
            mouseoverChar.dataset &&
            +(mouseoverChar.dataset.characterIndex || 0)
        )

        const nonwordMouseenter =
          !translationsAtCharacter.length &&
          !LETTERS_DIGITS_PLUS.test(value[mouseCharIndex])
        console.log({ nonwordMouseenter }, value[mouseCharIndex])
        if (!nonwordMouseenter) {
          setTranslationsAtCharacter(translationsAtCharacter)
        }
        // if (tokens.length && tokenHit && tokenHit.token) {
        if (translationsAtCharacter.length && mouseCharIndex !== -1) {
          // if (!editing && isMediaPlaying) {
          //   console.log('looping now!')
          //   setWasLoopingBeforeFocus(loopIsOn)
          //   dispatch(r.setLoop(true))
          //   // (ref.current as HTMLElement).focus()
          // }
          setSelectionRange(
            ref.current as HTMLElement,
            translationsAtCharacter[0].textCharacterIndex,
            translationsAtCharacter[0].textCharacterIndex +
              translationsAtCharacter[0].translatedTokens[0].matchedTokenText
                .length
          )
        }
      }
    },
    [popover.isOpen, mouseoverChar, tokenTranslations, ref, editing, value]
  )
  // loop when using dictionary
  const previousPopoverIsOpen = usePrevious(popover.isOpen)
  useEffect(
    () => {
      console.log('checking for loop!')
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
  useEffect(
    () => {
      console.log('checking for unloop!', {
        popoverIsOpen: popover.isOpen,
        previousPopoverIsOpen,
      })
      if (
        !popover.isOpen &&
        previousPopoverIsOpen &&
        isMediaPlaying &&
        // dictionaryPopoverIsShowing &&
        !editing &&
        wasLoopingBeforeFocus !== loopIsOn
      ) {
        console.log('looping now!', { wasLoopingBeforeFocus })
        dispatch(r.setLoop(wasLoopingBeforeFocus))
      }
    },
    [
      dictionaryPopoverIsShowing,
      editing,
      wasLoopingBeforeFocus,
      loopIsOn,
      isMediaPlaying,
      dispatch,
      popover.isOpen,
      previousPopoverIsOpen,
    ]
  )

  return {
    cursorPosition,
    translationsAtCharacter,
    onKeyDown,
    handleFocus,
    handleBlur,
    handleCharMouseEnter,
    handleMouseLeave,
  }
}
