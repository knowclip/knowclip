import React, {
  useCallback,
  ReactNodeArray,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import { TransliterationFlashcardFields } from '../types/Project'
import FieldMenu, {
  useSubtitlesBySource,
} from './FlashcardSectionFieldPopoverMenu'
import { Tooltip, IconButton, Button } from '@material-ui/core'
import { Add, LibraryAdd } from '@material-ui/icons'
import FlashcardDisplayField, {
  ClozeId,
  ClozeIds,
  ClozeColors,
} from './FlashcardSectionDisplayField'
import { useDispatch } from 'react-redux'
import FlashcardSectionDisplay from './FlashcardSectionDisplay'

const FlashcardSectionPreview = ({
  cardBases,
  chunkIndex,
  mediaFile,
  fieldsToTracks,
  viewMode,
}: {
  clipsIds: string[]
  cardBases: r.SubtitlesCardBases
  chunkIndex: number
  mediaFile: MediaFile
  fieldsToTracks: SubtitlesFlashcardFieldsLinks
  viewMode: ViewMode
}) => {
  const tracksToFieldsText = cardBases.getFieldsPreviewFromCardsBase(
    cardBases.cards[chunkIndex]
  )
  const fields = {} as TransliterationFlashcardFields
  for (const fieldName of cardBases.fieldNames) {
    const trackId = fieldsToTracks[fieldName]
    const text = trackId && tracksToFieldsText[trackId]
    fields[fieldName] = text || ''
  }

  const dispatch = useDispatch()
  const startEditing = useCallback(
    () => {
      dispatch(r.startEditingCards())
    },
    [dispatch]
  )

  const deletions = [
    { clozeId: 'c1' as const, ranges: [{ start: 0, end: 7 }] },
    {
      clozeId: 'c2' as const,
      ranges: [{ start: 5, end: 10 }, { start: 12, end: 15 }],
    },
  ]

  const {
    clozeIndex,
    setClozeIndex,
    previewClozeIndex,
    setPreviewClozeIndex,
  } = useClozeUi(deletions)

  return (
    <FlashcardSectionDisplay
      className={css.preview}
      mediaFile={mediaFile}
      fieldsToTracks={fieldsToTracks}
      fields={fields}
      viewMode={viewMode}
      clozeIndex={clozeIndex}
      previewClozeIndex={previewClozeIndex}
      clozeDeletions={deletions}
      menuItems={
        <>
          <Tooltip title="Create flashcard from these subtitles (E key)">
            <IconButton className={css.editCardButton} onClick={startEditing}>
              <LibraryAdd />
            </IconButton>
          </Tooltip>
          <ClozeButtons
            deletions={deletions}
            currentClozeIndex={clozeIndex}
            setClozeIndex={setClozeIndex}
            setPreviewClozeIndex={setPreviewClozeIndex}
          />
        </>
      }
    />
  )
}

const ClozeButtons = ({
  deletions,
  currentClozeIndex,
  setPreviewClozeIndex,
  setClozeIndex,
}: {
  deletions: ClozeDeletion[]
  currentClozeIndex?: number
  setPreviewClozeIndex: React.Dispatch<React.SetStateAction<number>>
  setClozeIndex: React.Dispatch<React.SetStateAction<number>>
}) => {
  const handleClick = useCallback(() => {}, [])

  const nextId = ClozeIds[deletions.length]
  const buttons = deletions.map(({ clozeId }, index) => {
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
        isActive={currentClozeIndex === index}
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
}: {
  hoverText: string
  id: ClozeId
  isActive: boolean
  index: number
  setClozeIndex: React.Dispatch<React.SetStateAction<number>>
  setPreviewClozeIndex: React.Dispatch<React.SetStateAction<number>>
}) => {
  const handleClick = useCallback(
    () => {
      if (isActive) setClozeIndex(-1)
      else setClozeIndex(index)
    },
    [index, isActive, setClozeIndex]
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
        onClick={handleClick}
        style={isActive ? { backgroundColor: ClozeColors[id] } : undefined}
      >
        {id.toUpperCase()}
      </Button>
    </Tooltip>
  )
}

function useClozeUi(deletions: ClozeDeletion[]) {
  const [clozeIndex, setClozeIndex] = useState<number>(-1)
  const [previewClozeIndex, setPreviewClozeIndex] = useState(-1)
  useEffect(
    () => {
      if (clozeIndex > deletions.length) setClozeIndex(deletions.length)
    },
    [clozeIndex, deletions.length]
  )
  useEffect(() => {
    const cKey = (e: KeyboardEvent) => {
      if (e.keyCode === 67) {
        const potentialNewIndex = clozeIndex + 1
        setClozeIndex(
          potentialNewIndex > deletions.length ? -1 : potentialNewIndex
        )
      }
    }
    document.addEventListener('keyup', cKey)

    return () => document.removeEventListener('keyup', cKey)
  })
  return {
    clozeIndex,
    setClozeIndex,
    previewClozeIndex,
    setPreviewClozeIndex,
  }
}

export default FlashcardSectionPreview
