import React, { useCallback, useRef } from 'react'
import css from './FlashcardSectionDisplay.module.css'
import { Tooltip, Button } from '@material-ui/core'
import { ClozeId, ClozeIds, ClozeColors } from './FlashcardSectionDisplayField'

const empty: ClozeDeletion[] = []

const ClozeButtons = ({
  deletions = empty,
  currentClozeIndex,
  setPreviewClozeIndex,
  setClozeIndex,
  confirmSelection,
  getSelection,
}: {
  deletions?: ClozeDeletion[]
  currentClozeIndex?: number
  setPreviewClozeIndex: (index: number) => void
  setClozeIndex: (index: number) => void
  confirmSelection: ((event: any) => ClozeRange | undefined)
  getSelection: () => ClozeRange | null
}) => {
  const nextId = ClozeIds[deletions.length]
  const buttons = deletions.map((cloze, index) => {
    const clozeId = ClozeIds[index]
    return (
      <ClozeButton
        key={clozeId}
        index={index}
        hoverText={
          currentClozeIndex === index
            ? `Finish editing cloze deletion card (Enter)`
            : `Edit cloze deletion card #${index + 1} (C key)`
        }
        id={clozeId}
        setClozeIndex={setClozeIndex}
        setPreviewClozeIndex={setPreviewClozeIndex}
        getSelection={getSelection}
        isActive={currentClozeIndex === index}
        confirmSelection={confirmSelection}
      />
    )
  })

  if (nextId)
    buttons.push(
      <ClozeButton
        hoverText="Make a new cloze deletion card (C key)"
        index={deletions.length}
        id={nextId}
        isActive={currentClozeIndex === deletions.length}
        setClozeIndex={setClozeIndex}
        setPreviewClozeIndex={setPreviewClozeIndex}
        getSelection={getSelection}
        confirmSelection={confirmSelection}
      />
    )
  return <>{buttons}</>
}

const ClozeButton = ({
  hoverText,
  id,
  isActive,
  index,
  setClozeIndex,
  setPreviewClozeIndex,
  confirmSelection,
  getSelection,
}: {
  hoverText: string
  id: ClozeId
  isActive: boolean
  index: number
  setClozeIndex: (index: number) => void
  setPreviewClozeIndex: (index: number) => void
  confirmSelection: (selection: ClozeRange) => void
  getSelection: () => ClozeRange | null
}) => {
  const selection = useRef<ClozeRange | null>(null)
  const handleMouseDown = useCallback(
    e => {
      selection.current = getSelection() || null
    },
    [getSelection]
  )
  const handleClick = useCallback(
    e => {
      if (selection.current) confirmSelection(selection.current)
      if (isActive) {
        if (!selection) setClozeIndex(-1)
      } else {
        setClozeIndex(index)
      }
      selection.current = null
    },
    [confirmSelection, index, isActive, setClozeIndex]
  )
  const handleMouseEnter = useCallback(
    () => {
      setPreviewClozeIndex(index)
    },
    [setPreviewClozeIndex, index]
  )
  const handleMouseLeave = useCallback(
    () => {
      setPreviewClozeIndex(-1)
    },
    [setPreviewClozeIndex]
  )
  return (
    <Tooltip title={hoverText}>
      <Button
        onMouseEnter={handleMouseEnter}
        onFocus={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onBlur={handleMouseLeave}
        className={css.clozeButton}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={isActive ? { backgroundColor: ClozeColors[id] } : undefined}
      >
        {id.toUpperCase()}
      </Button>
    </Tooltip>
  )
}

export default ClozeButtons
