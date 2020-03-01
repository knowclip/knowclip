import { useState, useEffect, useRef, useCallback } from 'react'
import { ClozeIds } from '../components/FlashcardSectionDisplayField'
import * as r from '../redux'
import { useSelector, useDispatch } from 'react-redux'

const empty: ClozeDeletion[] = []

export type ClozeTextInputActions = {
  onSelect: (
    selection: {
      start: number
      end: number
    }
  ) => void
  onBackspace: (
    selection: {
      start: number
      end: number
    }
  ) => void
  onPressDelete: (
    selection: {
      start: number
      end: number
    }
  ) => void
  onEnter: () => void
  onEscape: () => void
}

export default function useClozeUi({
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

  const inputRef = useRef<HTMLSpanElement>(null)

  const nextId = ClozeIds[deletions.length]

  const getSelection = useCallback(() => {
    const el = inputRef.current
    if (el) {
      return getSelectionWithin(el)
    }

    return null
  }, [])

  const makingNewCard =
    clozeIndex === deletions.length ||
    clozeIndex === -1 ||
    typeof clozeIndex !== 'number'
  const editingCard =
    clozeIndex < deletions.length &&
    clozeIndex !== -1 &&
    typeof clozeIndex === 'number'
  const confirmSelection = useCallback(
    e => {
      const selection = getSelection()
      if (nextId && selection) {
        if (makingNewCard) {
          const clozeDeletion: ClozeDeletion = {
            ranges: [selection],
          }
          onNewClozeCard(clozeDeletion)
          // if (playing) dispatch(r.setLoop(false))
        }

        if (editingCard && onEditClozeCard && selection) {
          onEditClozeCard(clozeIndex, [selection])
        }
      }
      return selection || undefined
    },
    [
      clozeIndex,
      editingCard,
      getSelection,
      makingNewCard,
      nextId,
      onEditClozeCard,
      onNewClozeCard,
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
      const cKey = (e: KeyboardEvent) => {
        // C key
        if (e.keyCode === 67) {
          const selection = getSelection()
          if (selection && selection.start !== selection.end) {
            confirmSelection(e)
          } else {
            const potentialNewIndex = clozeIndex + 1
            setClozeIndex(
              potentialNewIndex > deletions.length ? -1 : potentialNewIndex
            )
          }
        }

        // enter key
        if (e.keyCode === 13) {
          if (
            document.activeElement === inputRef.current ||
            !document.activeElement
          ) {
            const selection = getSelection()
            if (selection) {
              confirmSelection(e)
            }
          }
        }
      }
      document.addEventListener('keyup', cKey)

      return () => document.removeEventListener('keyup', cKey)
    },
    [
      clozeIndex,
      confirmSelection,
      deletions.length,
      getSelection,
      setClozeIndex,
    ]
  )

  const clozeTextInputActions: ClozeTextInputActions = {
    onSelect: useCallback(
      selection => {
        if (makingNewCard) {
          onNewClozeCard({
            ranges: [selection],
          })
        }
        if (editingCard && onEditClozeCard) {
          onEditClozeCard(
            clozeIndex,
            joinRanges(deletions[clozeIndex].ranges, selection)
          )
        }
      },
      [
        clozeIndex,
        deletions,
        editingCard,
        makingNewCard,
        onEditClozeCard,
        onNewClozeCard,
      ]
    ),
    onBackspace: useCallback(
      selection => {
        if (editingCard && onEditClozeCard && inputRef.current) {
          if (selection.start === selection.end && selection.start !== 0) {
            const newCursor = selection.start - 1
            setSelectionRange(inputRef.current, newCursor, newCursor)
            onEditClozeCard(
              clozeIndex,
              removeRange(deletions[clozeIndex].ranges, {
                start: newCursor,
                end: selection.start,
              })
            )
          } else {
            const newCursor = Math.min(selection.start, selection.end)
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
    onEnter: () => {
      if (clozeIndex !== -1) {
        setClozeIndex(-1)
      }
    },
    onEscape: () => {
      setClozeIndex(-1)
    },
  }

  return {
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

  return { start: start, end: end }
}

const joinRanges = (base: ClozeRange[], newRange: ClozeRange) => {
  const ranges: ClozeRange[] = []

  let newMergedRange = newRange
  for (const range of base) {
    const overlapping =
      newRange.start <= range.end && newRange.end >= range.start
    const adjacent =
      range.end === newRange.start || newRange.end === range.start
    if (overlapping || adjacent) {
      newMergedRange = {
        start: Math.min(newMergedRange.start, range.start),
        end: Math.max(newMergedRange.end, range.end),
      }
    } else {
      ranges.push(range)
    }
  }
  ranges.push(newMergedRange)
  ranges.sort((a, b) => a.start - b.start)

  return ranges
}

const removeRange = (base: ClozeRange[], toDelete: ClozeRange) => {
  const ranges: ClozeRange[] = []

  for (const range of base) {
    // + 1?
    if (toDelete.start <= range.end && toDelete.end >= range.start) {
      if (toDelete.start > range.start)
        ranges.push({
          start: range.start,
          end: toDelete.start,
        })

      if (toDelete.end < range.end)
        ranges.push({
          start: toDelete.end,
          end: range.end,
        })
    } else {
      ranges.push(range)
    }
  }

  return ranges
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
