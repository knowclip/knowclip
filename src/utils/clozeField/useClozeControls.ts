import { useState, useEffect, useRef, useCallback } from 'react'
import * as r from '../../redux'
import { useSelector, useDispatch } from 'react-redux'
import { ClozeIds } from '../../components/FlashcardSectionDisplayClozeField'
import {
  collapseRanges,
  removeRange,
  trimClozeRangeOverlaps,
} from '../clozeRanges'
import { KEYS } from '../keyboard'
import { getSelectionWithin, setSelectionRange } from './domSelection'

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
  const playing = useSelector((state: AppState) => r.isMediaPlaying(state))
  const dispatch = useDispatch()

  const selection = useRef<ClozeRange | null>(null)

  const [clozeIndex, _setClozeIndex] = useState<number>(-1)
  const [previewClozeIndex, setPreviewClozeIndex] = useState(-1)
  const setClozeIndex = useCallback(
    (newIndex: number) => {
      const currentDeletion = deletions.length ? deletions[clozeIndex] : null
      if (
        currentDeletion &&
        (currentDeletion.ranges.length === 0 ||
          currentDeletion.ranges.every(r => r.start === r.end))
      ) {
        if (onDeleteClozeCard) onDeleteClozeCard(clozeIndex)
        const nextIndex = newIndex <= clozeIndex ? newIndex : newIndex - 1
        _setClozeIndex(nextIndex)
      } else {
        _setClozeIndex(newIndex)
      }
      if (playing) dispatch(r.setLoop(newIndex !== -1))
    },
    [clozeIndex, deletions, dispatch, onDeleteClozeCard, playing]
  )
  useEffect(
    () => {
      ;(window as any).cloze = clozeIndex !== -1
      return () => {
        ;(window as any).cloze = false
      }
    },
    [clozeIndex]
  )

  const inputRef = useRef<HTMLSpanElement>(null)

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
        if (currentClozeIndex !== clozeIndex) setClozeIndex(clozeIndex)
      }

      if (inputRef.current)
        setSelectionRange(inputRef.current, selection.end, selection.end)

      return selection || undefined
    },
    [
      deletions,
      onEditClozeCard,
      selectionGivesNewCard,
      onNewClozeCard,
      currentClozeIndex,
      setClozeIndex,
    ]
  )

  useEffect(
    () => {
      if (clozeIndex > deletions.length) setClozeIndex(deletions.length)
    },
    [clozeIndex, deletions.length, setClozeIndex]
  )
  useEffect(
    () => {
      const keyup = (e: KeyboardEvent) => {
        const currentSelection = selection.current
        selection.current = null

        if (
          (e.key === KEYS.enter ||
            (e.key.toLowerCase() === KEYS.cLowercase &&
              !e.metaKey &&
              !e.ctrlKey)) &&
          currentSelection &&
          currentSelection.start !== currentSelection.end
        ) {
          // C key
          // enter key
          if (clozeIndex === -1) {
            const newIndex = deletions.length
            if (newIndex < ClozeIds.length)
              return confirmSelection(newIndex, currentSelection)
            else
              return dispatch(
                r.simpleMessageSnackbar(
                  `You've already reached the maximum of ${
                    ClozeIds.length
                  } cloze deletions per card.`
                )
              )
          }
          return confirmSelection(clozeIndex, currentSelection)
        } else if (
          e.key.toLowerCase() === KEYS.cLowercase &&
          !e.metaKey &&
          !e.ctrlKey
        ) {
          const potentialNewIndex = clozeIndex + 1
          const newIndex =
            potentialNewIndex > deletions.length ? -1 : potentialNewIndex
          return setClozeIndex(newIndex)
        } else if (e.key === KEYS.enter || e.key === KEYS.escape) {
          if (clozeIndex !== -1) setClozeIndex(-1)
        }
      }

      document.addEventListener('keyup', keyup)

      return () => document.removeEventListener('keyup', keyup)
    },
    [
      clozeIndex,
      confirmSelection,
      deletions.length,
      dispatch,
      getSelection,
      setClozeIndex,
    ]
  )

  const registerSelection = useCallback(
    () => {
      selection.current = getSelection() || null
    },
    [getSelection, selection]
  )

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (
        e.key === KEYS.enter ||
        (e.key.toLowerCase() === KEYS.cLowercase && !e.metaKey && !e.ctrlKey)
      ) {
        registerSelection()
      }
    }
    document.addEventListener('keydown', keydown)

    return () => document.removeEventListener('keydown', keydown)
  })

  const clozeTextInputActions = {
    // onSelect: useCallback(
    //   selection => {
    //     if (selectionGivesNewCard(selection)) {
    //       onNewClozeCard({
    //         ranges: [selection],
    //       })
    //     }
    //     if (editingCard && onEditClozeCard) {
    //       const ranges = collapseRanges(deletions[clozeIndex].ranges, selection)
    //       if (ranges !== deletions[clozeIndex].ranges)
    //         onEditClozeCard(clozeIndex, ranges)
    //     }
    //   },
    //   [
    //     clozeIndex,
    //     deletions,
    //     editingCard,
    //     onEditClozeCard,
    //     onNewClozeCard,
    //     selectionGivesNewCard,
    //   ]
    // ),
    onBackspace: useCallback(
      // TODO: fix cloze trim behavior
      selection => {
        if (editingCard && onEditClozeCard && inputRef.current) {
          if (selection.start === selection.end && selection.start !== 0) {
            const newCursor = selection.start - 1
            setSelectionRange(inputRef.current, newCursor, newCursor)
            const newRanges = removeRange(deletions[clozeIndex].ranges, {
              start: newCursor,
              end: selection.start,
            })
            onEditClozeCard(clozeIndex, newRanges)
          } else {
            const newCursor = Math.min(selection.start, selection.end)
            setSelectionRange(inputRef.current, newCursor, newCursor)
            onEditClozeCard(
              clozeIndex,
              removeRange(deletions[clozeIndex].ranges, selection)
            )
          }
        } else if (inputRef.current) {
          const newCursor = selection.end - 1
          setSelectionRange(inputRef.current, newCursor, newCursor)
        }
      },
      [clozeIndex, deletions, editingCard, onEditClozeCard]
    ),
    onPressDelete: useCallback(
      selection => {
        if (editingCard && onEditClozeCard && inputRef.current) {
          if (selection.start === selection.end) {
            const newCursor = selection.end + 1
            setSelectionRange(inputRef.current, newCursor, newCursor)
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
            onEditClozeCard(
              clozeIndex,
              removeRange(deletions[clozeIndex].ranges, selection)
            )
          }
        }
      },
      [clozeIndex, deletions, editingCard, onEditClozeCard]
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
  }
}
