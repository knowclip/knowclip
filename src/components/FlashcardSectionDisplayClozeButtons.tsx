import React, { useCallback, MutableRefObject } from 'react'
import css from './FlashcardSectionDisplay.module.css'
import { Tooltip, Button } from '@material-ui/core'
import {
  ClozeId,
  ClozeIds,
  ClozeHues,
} from './FlashcardSectionDisplayClozeField'
import { ClozeControls } from '../utils/useClozeUi'

const empty: ClozeDeletion[] = []

const ClozeButtons = ({
  controls: {
    deletions = empty,
    clozeIndex: currentClozeIndex,
    setPreviewClozeIndex,
    setClozeIndex,
    confirmSelection,
    getSelection,
    selection,
  },
}: {
  controls: ClozeControls
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
        selection={selection}
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
        getSelection={getSelection}
        confirmSelection={confirmSelection}
        selection={selection}
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
  selection,
}: {
  hoverText: string
  id: ClozeId
  isActive: boolean
  index: number
  setClozeIndex: (index: number) => void
  setPreviewClozeIndex?: (index: number) => void
  confirmSelection: ((clozeIndex: number, selection: ClozeRange) => void)
  getSelection: () => ClozeRange | null
  selection: MutableRefObject<ClozeRange | null>
}) => {
  const registerSelection = useCallback(
    () => {
      selection.current = getSelection() || null
    },
    [getSelection, selection]
  )
  const handleClick = useCallback(
    () => {
      const textSelected =
        selection.current && selection.current.start !== selection.current.end
      if (selection.current && textSelected) {
        // TODO: make this add to existing cloze card
        // for this cloze button's clozeIndex
        // in case current clozeIndex is -1
        confirmSelection(index, selection.current)
        console.log('confirmSelction!', { index, selection: selection.current })
      } else if (isActive) {
        if (!textSelected) setClozeIndex(-1)
      } else {
        setClozeIndex(index)
      }
      selection.current = null
    },
    [confirmSelection, index, isActive, selection, setClozeIndex]
  )
  const handleMouseEnter = useCallback(
    () => {
      if (setPreviewClozeIndex) setPreviewClozeIndex(index)
    },
    [setPreviewClozeIndex, index]
  )
  const handleMouseLeave = useCallback(
    () => {
      if (setPreviewClozeIndex) setPreviewClozeIndex(-1)
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
        onMouseDown={registerSelection}
        onClick={handleClick}
        style={
          isActive
            ? { backgroundColor: `hsla(${ClozeHues[id]}, 60%, 80%, 75%)` }
            : undefined
        }
      >
        {id.toUpperCase()}
      </Button>
    </Tooltip>
  )
}

export default ClozeButtons
