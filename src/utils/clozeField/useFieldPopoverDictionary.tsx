import { SyntheticEvent, useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ClozeControls } from './useClozeControls'
import { setSelectionRange } from './domSelection'
import r from '../../redux'
import { KEYS } from '../keyboard'
import { lookUpInDictionary } from '../dictionariesDatabase'
import { isTextFieldFocused } from '../isTextFieldFocused'
import usePopover from '../usePopover'
import {
  findTranslationsAtCharIndex,
  TranslatedTokensAtCharacterIndex,
} from '../dictionaries/findTranslationsAtCharIndex'
import { usePrevious } from '../usePrevious'
import { useClozeUiEffects } from './useClozeUiEffects'
import { LETTERS_DIGITS_PLUS } from '../dictCc'
import { getMousePosition } from '../mousePosition'
import { isMediaPlaying } from '../media'
import { lookUpYomitan } from '../dictionaries/lookUpYomitan'

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
  activeDictionaries: SettingsState['activeDictionaries'],
  clozeControls: ClozeControls,
  value: string,
  editing: boolean
) {
  const { inputRef: ref } = clozeControls
  const dispatch = useDispatch()
  const { loopState, popoverIsOpenFromStore } = useSelector(
    (state: AppState) => ({
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
    if (openingPopover && !editing && isMediaPlaying()) {
      dispatch(r.setLoop('FOCUS'))
    }
  }, [popover.isOpen, editing, previousPopoverIsOpen, loopState, dispatch])

  const popoverWasOpen = usePrevious(popover.isOpen)

  useEffect(() => {
    const closingPopover = popoverWasOpen && !popover.isOpen
    if (closingPopover) {
      if (isMediaPlaying() && !editing && loopState === 'FOCUS') {
        dispatch(r.setLoop(false))
      }
    }
  }, [dispatch, editing, loopState, popover.isOpen, popoverWasOpen])

  useEffect(() => {
    if (popoverWasOpen && popover.isOpen && !popoverIsOpenFromStore) {
      closePopover({} as SyntheticEvent)
    }
  }, [
    popoverWasOpen,
    popover.isOpen,
    popoverIsOpenFromStore,
    closePopover,
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
  const [yomitanLookupResult, setYomitanLookupResult] = useState<Awaited<
    ReturnType<typeof lookUpYomitan>
  > | null>(null)

  const { onKeyDown, handleFocus, handleBlur, cursorPosition } =
    useClozeUiEffects(
      clozeControls,
      value,
      dispatch,
      dictionaryPopoverIsShowing,
      editing,
      loopState
    )

  const activeDictionariesIds = useMemo(
    () => new Set(activeDictionaries?.map((d) => d.id) || []),
    [activeDictionaries]
  )

  useEffect(() => {
    if (activeDictionaryType) {
      lookUpInDictionary(
        activeDictionaryType,
        activeDictionariesIds,
        value
      ).then((lookup) => {
        if ('tags' in lookup) {
          setYomitanLookupResult(lookup)
          const newTokensTranslations = Array.from(
            value,
            (_, i): TranslatedTokensAtCharacterIndex[] => {
              const translatedTokens =
                lookup.getTranslatedTokensAtCharacterIndex(i)
              return translatedTokens.length === 0
                ? []
                : [
                    {
                      textCharacterIndex: i,
                      translatedTokens,
                    },
                  ]
            }
          ).flat()
          console.log({ newTokensTranslations })
          setTokenTranslations(newTokensTranslations)
          console.log({ lookup })
        } else {
          setTokenTranslations(lookup.tokensTranslations)
          setYomitanLookupResult(null)
        }
      })
    } else {
      setTokenTranslations([])
    }
  }, [value, activeDictionariesIds, activeDictionaryType])

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
    yomitanLookupResult,
    onKeyDown,
    handleFocus,
    handleBlur,
  }
}
