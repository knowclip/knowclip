import { useState, useEffect, useRef, useCallback } from 'react'
import r from '../../redux'
import { useDispatch } from 'react-redux'
import { ClozeIds } from '../../components/FlashcardSectionDisplayClozeField'
import {
  collapseRanges,
  removeRange,
  trimClozeRangeOverlaps,
} from '../clozeRanges'
import { KEYS } from '../keyboard'
import { getSelectionWithin, setSelectionRange } from './domSelection'
import { useClozeCursorPosition } from './useClozeUiEffects'
import { isMediaPlaying } from '../media'

const empty: ClozeDeletion[] = []

export type ClozeControls = ReturnType<typeof useClozeControls>

export default function useClozeControls({
  deletions = empty,
  onNewClozeCard,
  onEditClozeCard,
  onDeleteClozeCard,
}: {
  deletions?: ClozeDeletion[]
  onNewClozeCard: (deletion: ClozeDeletion) => void
  // clozeTextInputActions: ClozeTextInputActions,
  onEditClozeCard?: (
    clozeIndex: number,
    ranges: ClozeDeletion['ranges']
  ) => void
  onDeleteClozeCard?: (clozeIndex: number) => void
}) {
  const dispatch = useDispatch()

  const inputRef = useRef<HTMLSpanElement>(null)
  const { cursorPosition, setCursorPosition } = useClozeCursorPosition(inputRef)
  const selection = useRef<ClozeRange | null>(null)

  const [clozeIndex, _setClozeIndex] = useState<number>(-1)
  const [previewClozeIndex, setPreviewClozeIndex] = useState(-1)
  const setClozeIndex = useCallback(
    (newIndex: number, _reason?: string) => {
      const currentDeletion = deletions.length ? deletions[clozeIndex] : null
      if (
        currentDeletion &&
        (currentDeletion.ranges.length === 0 ||
          currentDeletion.ranges.every((r) => r.start === r.end))
      ) {
        if (onDeleteClozeCard) onDeleteClozeCard(clozeIndex)
        const nextIndex = newIndex <= clozeIndex ? newIndex : newIndex - 1
        _setClozeIndex(nextIndex)
      } else {
        _setClozeIndex(newIndex)
      }
      if (isMediaPlaying())
        dispatch(r.setLoop(newIndex !== -1 ? 'EDIT' : false))
    },
    [clozeIndex, deletions, dispatch, onDeleteClozeCard]
  )
  useEffect(() => {
    ;(window as any).cloze = clozeIndex !== -1
    return () => {
      ;(window as any).cloze = false
    }
  }, [clozeIndex])

  const getSelection = useCallback(() => {
    const el = inputRef.current
    if (el) {
      return getSelectionWithin(el)
    }

    return null
  }, [])

  const selectionGivesNewCard = useCallback(
    (selection: ClozeRange) => {
      if (clozeIndex !== deletions.length && clozeIndex !== -1) return false

      const newDeletions = trimClozeRangeOverlaps(
        deletions,
        {
          ranges: [selection],
        },
        deletions.length
      )
      return newDeletions !== deletions
    },
    [clozeIndex, deletions]
  )

  const currentClozeIndex = clozeIndex
  const editingCard = clozeIndex < deletions.length && clozeIndex !== -1
  const confirmSelection = useCallback(
    (clozeIndex: number, selection: ClozeRange) => {
      if (clozeIndex === -1 || clozeIndex === deletions.length) {
        if (selectionGivesNewCard(selection)) {
          const clozeDeletion: ClozeDeletion = {
            ranges: [selection],
          }
          onNewClozeCard(clozeDeletion)
        }
      }

      const editingCard = clozeIndex < deletions.length && clozeIndex !== -1
      if (editingCard && onEditClozeCard) {
        const baseRanges = deletions[clozeIndex]
          ? deletions[clozeIndex].ranges
          : []
        const ranges = collapseRanges(baseRanges, selection)
        if (ranges !== baseRanges) onEditClozeCard(clozeIndex, ranges)
        if (currentClozeIndex !== clozeIndex)
          setClozeIndex(clozeIndex, 'confirmSelection')
      }

      if (inputRef.current) {
        setSelectionRange(inputRef.current, selection.end, selection.end)
        setCursorPosition(selection.end)
      }

      return selection || undefined
    },
    [
      deletions,
      onEditClozeCard,
      selectionGivesNewCard,
      onNewClozeCard,
      currentClozeIndex,
      setClozeIndex,
      setCursorPosition,
    ]
  )

  useEffect(() => {
    if (clozeIndex > deletions.length)
      setClozeIndex(deletions.length, 'clozeIndex > deletions.length')
  }, [clozeIndex, deletions.length, setClozeIndex])
  useEffect(() => {
    const keyup = (e: KeyboardEvent) => {
      const s = getSelection()
      const currentSelection = s && s.start !== s.end ? s : null
      selection.current = null
      const clozeIsActive = clozeIndex !== -1

      if ((isEnterKey(e) || isCKey(e)) && currentSelection) {
        if (clozeIsActive) return confirmSelection(clozeIndex, currentSelection)

        const newIndex = deletions.length
        if (newIndex < ClozeIds.length)
          return confirmSelection(newIndex, currentSelection)

        return dispatch(
          r.simpleMessageSnackbar(
            `You've already reached the maximum of ${ClozeIds.length} cloze deletions per card.`
          )
        )
      } else if (isCKey(e)) {
        const potentialNewIndex = clozeIndex + 1
        const newIndex =
          potentialNewIndex > deletions.length ? -1 : potentialNewIndex
        return setClozeIndex(newIndex, 'c pressed')
      } else if (isEnterKey(e) || e.key === KEYS.escape) {
        if (clozeIsActive && !(window as any).clozeButtonWasPressed)
          setClozeIndex(-1, 'enter or escape pressed')
      }
    }

    document.addEventListener('keyup', keyup)

    return () => document.removeEventListener('keyup', keyup)
  }, [
    clozeIndex,
    confirmSelection,
    deletions.length,
    dispatch,
    getSelection,
    setClozeIndex,
  ])

  const registerSelection = useCallback(() => {
    selection.current = getSelection() || null
  }, [getSelection, selection])

  useEffect(() => {
    const keyup = (e: KeyboardEvent) => {
      if (isEnterKey(e) || isCKey(e)) {
        registerSelection()
      }
    }
    document.addEventListener('keyup', keyup)

    return () => document.removeEventListener('keyup', keyup)
  })

  const clozeTextInputActions = {
    onBackspace: useCallback(
      (selection: ClozeRange) => {
        if (editingCard && onEditClozeCard && inputRef.current) {
          if (selection.start === selection.end && selection.start !== 0) {
            const newCursor = selection.start - 1
            setSelectionRange(inputRef.current, newCursor, newCursor)
            setCursorPosition(newCursor)
            const newRanges = removeRange(deletions[clozeIndex].ranges, {
              start: newCursor,
              end: selection.start,
            })
            onEditClozeCard(clozeIndex, newRanges)
          } else {
            const newCursor = Math.min(selection.start, selection.end)
            setSelectionRange(inputRef.current, newCursor, newCursor)
            setCursorPosition(newCursor)
            onEditClozeCard(
              clozeIndex,
              removeRange(deletions[clozeIndex].ranges, selection)
            )
          }
        } else if (inputRef.current) {
          const newCursor = selection.end - 1
          setSelectionRange(inputRef.current, newCursor, newCursor)
          setCursorPosition(newCursor)
        }
      },
      [clozeIndex, deletions, editingCard, onEditClozeCard, setCursorPosition]
    ),
    onPressDelete: useCallback(
      (selection: ClozeRange) => {
        if (editingCard && onEditClozeCard && inputRef.current) {
          if (selection.start === selection.end) {
            const newCursor = selection.end + 1
            setSelectionRange(inputRef.current, newCursor, newCursor)
            setCursorPosition(newCursor)
            onEditClozeCard(
              clozeIndex,
              removeRange(deletions[clozeIndex].ranges, {
                start: selection.end,
                end: selection.end + 1,
              })
            )
          } else {
            const newCursor = Math.max(selection.start, selection.end)
            setSelectionRange(inputRef.current, newCursor, newCursor)
            setCursorPosition(newCursor)
            onEditClozeCard(
              clozeIndex,
              removeRange(deletions[clozeIndex].ranges, selection)
            )
          }
        }
      },
      [clozeIndex, deletions, editingCard, onEditClozeCard, setCursorPosition]
    ),
  }

  return {
    deletions,
    selection,
    clozeIndex,
    setClozeIndex,
    previewClozeIndex,
    setPreviewClozeIndex,
    inputRef,
    confirmSelection,
    clozeTextInputActions,
    getSelection,
    setCursorPosition,
    cursorPosition,
  }
}
function isEnterKey(e: KeyboardEvent) {
  return e.key === KEYS.enter
}

function isCKey(e: KeyboardEvent): boolean {
  return e.key.toLowerCase() === KEYS.cLowercase && !e.metaKey && !e.ctrlKey
}
