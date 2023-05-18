import React, { useCallback, MutableRefObject } from 'react'
import cn from 'classnames'
import css from './FlashcardSectionDisplay.module.css'
import { Tooltip, Button } from '@mui/material'
import {
  ClozeId,
  ClozeIds,
  ClozeHues,
} from './FlashcardSectionDisplayClozeField'
import { ClozeControls } from '../utils/clozeField/useClozeControls'
import { getKeyboardShortcut } from './KeyboardShortcuts'

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
  const buttons = deletions.map((_cloze, index) => {
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
        key={nextId}
        hoverText={
          currentClozeIndex === -1
            ? `Make cloze deletion (${getKeyboardShortcut(
                'Start making cloze deletion'
              )} key)`
            : currentClozeIndex === deletions.length
            ? `Stop editing cloze deletions (${getKeyboardShortcut(
                'Stop making cloze deletion'
              )})`
            : `Make a new cloze deletion card (${getKeyboardShortcut(
                'Start making cloze deletion'
              )} key)`
        }
        index={deletions.length}
        id={nextId}
        isActive={currentClozeIndex === deletions.length}
        setClozeIndex={setClozeIndex}
        getSelection={getSelection}
        confirmSelection={confirmSelection}
        selection={selection}
      />
    )
  return (
    <section
      className={cn(css.clozeButtons, {
        [css.openClozeButtons]: currentClozeIndex !== -1,
      })}
    >
      {buttons}
    </section>
  )
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
  setClozeIndex: ClozeControls['setClozeIndex']
  setPreviewClozeIndex?: (index: number) => void
  confirmSelection: (clozeIndex: number, selection: ClozeRange) => void
  getSelection: () => ClozeRange | null
  selection: MutableRefObject<ClozeRange | null>
}) => {
  const handleMouseDown = useCallback(
    (e) => {
      selection.current = getSelection() || null
      // don't focus yet so buttons won't expand and prevent click from firing
      e.preventDefault()
    },
    [getSelection, selection]
  )
  const handleClick = useCallback(
    (e) => {
      selection.current = getSelection() || null

      const textSelected =
        selection.current && selection.current.start !== selection.current.end
      if (selection.current && textSelected) {
        confirmSelection(index, selection.current)
      } else if (isActive) {
        if (!textSelected)
          setClozeIndex(
            -1,
            'cloze button clicked while active and no text selected'
          )
      } else {
        setClozeIndex(index, 'cloze button clicked')
      }
      selection.current = null

      e.target.focus()
    },
    [confirmSelection, getSelection, index, isActive, selection, setClozeIndex]
  )
  const handleMouseEnter = useCallback(() => {
    if (setPreviewClozeIndex) setPreviewClozeIndex(index)
  }, [setPreviewClozeIndex, index])
  const handleMouseLeave = useCallback(() => {
    if (setPreviewClozeIndex) setPreviewClozeIndex(-1)
  }, [setPreviewClozeIndex])
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
        onKeyDown={() => {
          // so that next enter keyup
          // does not trigger cloze selection confirmation

          ;(window as any).clozeButtonWasPressed = true
          const resetClozeButtonWasPressed = () => {
            ;(window as any).clozeButtonWasPressed = false
            window.removeEventListener('keyup', resetClozeButtonWasPressed)
          }
          window.addEventListener('keyup', resetClozeButtonWasPressed)
        }}
        style={{
          backgroundColor: isActive
            ? `hsla(${ClozeHues[id]}, 60%, 80%, 75%)`
            : undefined,
          ['--cloze-hue' as any]: ClozeHues[id],
        }}
      >
        {id.toUpperCase()}
      </Button>
    </Tooltip>
  )
}

export default ClozeButtons
