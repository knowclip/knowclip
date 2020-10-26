import React, { useCallback } from 'react'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import { TransliterationFlashcardFields } from '../types/Project'
import { Tooltip, IconButton } from '@material-ui/core'
import { LibraryAdd, Photo, Loop } from '@material-ui/icons'
import { useDispatch, useSelector } from 'react-redux'
import FlashcardSectionDisplay from './FlashcardSectionDisplay'
import useClozeControls from '../utils/clozeField/useClozeControls'
import ClozeButtons from './FlashcardSectionDisplayClozeButtons'

const FlashcardSectionPreview = ({
  cardBases,
  cardPreviewSelection,
  mediaFile,
  fieldsToTracks,
  viewMode,
  className,
}: {
  clipsIds: string[]
  cardBases: r.SubtitlesCardBases
  cardPreviewSelection: {
    type: 'Preview'
    index: number
    item: r.SubtitlesCardBase
    cardBaseIndex: number
  }
  mediaFile: MediaFile
  fieldsToTracks: SubtitlesFlashcardFieldsLinks
  viewMode: ViewMode
  className: string
}) => {
  const tracksToFieldsText = cardBases.getFieldsPreviewFromCardsBase(
    cardPreviewSelection.item
  )
  const fields = {} as TransliterationFlashcardFields
  for (const fieldName of cardBases.fieldNames) {
    const trackId = fieldsToTracks[fieldName]
    const text = trackId && tracksToFieldsText[trackId]
    fields[fieldName] = text || ''
  }

  const dispatch = useDispatch()
  const startEditing = useCallback(() => {
    dispatch(r.startEditingCards())
  }, [dispatch])

  const clozeControls = useClozeControls({
    onNewClozeCard: useCallback(
      (deletion) => {
        dispatch(r.newClipFromSubtitlesChunk(cardPreviewSelection, deletion))
      },
      [cardPreviewSelection, dispatch]
    ),
  })

  const { defaultIncludeStill, isLoopOn } = useSelector((state: AppState) => ({
    defaultIncludeStill: r.getDefaultIncludeStill(state),
    isLoopOn: r.isLoopOn(state),
  }))

  const toggleIncludeStill = useCallback(() => {
    dispatch(r.setDefaultClipSpecs({ includeStill: !defaultIncludeStill }))
  }, [defaultIncludeStill, dispatch])
  const toggleLoop = useCallback(() => dispatch(r.toggleLoop()), [dispatch])
  return (
    <FlashcardSectionDisplay
      className={cn(className, css.preview)}
      mediaFile={mediaFile}
      fieldsToTracks={fieldsToTracks}
      fields={fields}
      viewMode={viewMode}
      clozeControls={clozeControls}
      menuItems={
        <>
          {(fields.transcription || '').trim() && (
            <ClozeButtons controls={clozeControls} />
          )}
          <Tooltip title="Create flashcard and start editing (E key)">
            <IconButton className={css.editCardButton} onClick={startEditing}>
              <LibraryAdd />
            </IconButton>
          </Tooltip>
        </>
      }
      secondaryMenuItems={
        <>
          <Tooltip title="Loop selection (Ctrl + L)">
            <IconButton
              onClick={toggleLoop}
              color={isLoopOn ? 'secondary' : 'default'}
            >
              <Loop />
            </IconButton>
          </Tooltip>
          {mediaFile.isVideo && (
            <Tooltip
              title={
                defaultIncludeStill
                  ? 'Click to leave out image by default when creating a card'
                  : 'Click to include image by default when creating a card'
              }
            >
              <IconButton
                className={css.editCardButton}
                onClick={toggleIncludeStill}
                style={{
                  color: defaultIncludeStill ? 'rgba(0, 0, 0, 0.54)' : '#ddd',
                }}
              >
                <Photo />
              </IconButton>
            </Tooltip>
          )}
        </>
      }
    />
  )
}

export default FlashcardSectionPreview
