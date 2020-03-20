import { useState, useEffect, useRef, useCallback } from 'react'
import * as r from '../redux'
import { useSelector, useDispatch } from 'react-redux'
import { ClozeIds } from '../components/FlashcardSectionDisplayClozeField'
import {
  collapseRanges,
  removeRange,
  trimClozeRangeOverlaps,
} from './clozeRanges'

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
          (e.keyCode === 13 ||
            (e.keyCode === 67 && !e.metaKey && !e.ctrlKey)) &&
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
          // C key
        } else if (e.keyCode === 67 && !e.metaKey && !e.ctrlKey) {
          const potentialNewIndex = clozeIndex + 1
          const newIndex =
            potentialNewIndex > deletions.length ? -1 : potentialNewIndex
          return setClozeIndex(newIndex)
          // enter or esc
        } else if (e.keyCode === 13 || e.keyCode === 27) {
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
      // enter or C
      if (e.keyCode === 13 || (e.keyCode === 67 && !e.metaKey && !e.ctrlKey)) {
        registerSelection()
      }
    }
    document.addEventListener('keydown', keydown)

    return () => document.removeEventListener('keydown', keydown)
  })

  const clozeTextInputActions = {
    onSelect: useCallback(
      selection => {
        if (selectionGivesNewCard(selection)) {
          onNewClozeCard({
            ranges: [selection],
          })
        }
        if (editingCard && onEditClozeCard) {
          const ranges = collapseRanges(deletions[clozeIndex].ranges, selection)
          if (ranges !== deletions[clozeIndex].ranges)
            onEditClozeCard(clozeIndex, ranges)
        }
      },
      [
        clozeIndex,
        deletions,
        editingCard,
        onEditClozeCard,
        onNewClozeCard,
        selectionGivesNewCard,
      ]
    ),
    onBackspace: useCallback(
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

export function getSelectionWithin(element: HTMLElement) {
  var start = 0
  var end = 0
  var doc = element.ownerDocument as Document
  var win = doc.defaultView as Window
  var sel = win.getSelection() as Selection
  if (sel.rangeCount > 0) {
    var range = (win.getSelection() as Selection).getRangeAt(0)
    var preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(element)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    start = preCaretRange.toString().length
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    end = preCaretRange.toString().length
  }

  const innerText = element.innerText
  const length = innerText.length

  return {
    start: Math.max(0, Math.min(start, length)),
    end: Math.max(0, Math.min(end, length)),
  }
}

function getTextNodesIn(node: Node) {
  var textNodes: Text[] = []
  if (node.nodeType === 3) {
    const textNode = node as Text
    textNodes.push(textNode)
  } else {
    var children = node.childNodes
    for (var i = 0, len = children.length; i < len; ++i) {
      textNodes.push.apply(textNodes, getTextNodesIn(children[i]))
    }
  }
  return textNodes
}

function setSelectionRange(el: HTMLElement, start: number, end: number) {
  var range = document.createRange()
  range.selectNodeContents(el)
  var textNodes = getTextNodesIn(el)
  var foundStart = false
  var charCount = 0,
    endCharCount

  for (var i = 0, textNode; (textNode = textNodes[i++]); ) {
    endCharCount = charCount + textNode.length
    if (
      !foundStart &&
      start >= charCount &&
      (start < endCharCount ||
        (start === endCharCount && i <= textNodes.length))
    ) {
      range.setStart((textNode as unknown) as Node, start - charCount)
      foundStart = true
    }
    if (foundStart && end <= endCharCount) {
      range.setEnd(textNode, end - charCount)
      break
    }
    charCount = endCharCount
  }

  var sel = window.getSelection()
  if (sel) {
    sel.removeAllRanges()
    sel.addRange(range)
  }
}
