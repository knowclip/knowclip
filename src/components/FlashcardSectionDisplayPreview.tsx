import React, { useCallback } from 'react'
import cn from 'classnames'
import r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import { TransliterationFlashcardFields } from '../types/Project'
import { Tooltip, IconButton } from '@mui/material'
import { LibraryAdd, Photo, Loop } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import FlashcardSectionDisplay from './FlashcardSectionDisplay'
import useClozeControls from '../utils/clozeField/useClozeControls'
import ClozeButtons from './FlashcardSectionDisplayClozeButtons'
import { getKeyboardShortcut } from './KeyboardShortcuts'
import { SubtitlesCardBase, SubtitlesCardBases } from '../selectors'

const FlashcardSectionPreview = ({
  cardBases,
  cardBase,
  mediaFile,
  fieldsToTracks,
  viewMode,
  className,
}: {
  clipsIds: string[]
  cardBases: SubtitlesCardBases
  cardBase: SubtitlesCardBase
  mediaFile: MediaFile
  fieldsToTracks: SubtitlesFlashcardFieldsLinks
  viewMode: ViewMode
  className: string
}) => {
  const tracksToFieldsText = cardBases.getFieldsPreviewFromCardsBase(cardBase)
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
        dispatch(
          r.newCardFromSubtitlesRequest(
            {
              type: 'Preview',
              id: cardBase.id,
            },
            deletion
          )
        )
      },
      [cardBase, dispatch]
    ),
  })

  const { defaultIncludeStill, isLoopOn } = useSelector((state: AppState) => ({
    defaultIncludeStill: r.getDefaultIncludeStill(state),
    isLoopOn: r.getLoopState(state),
  }))

  const toggleIncludeStill = useCallback(() => {
    dispatch(r.setDefaultClipSpecs({ includeStill: !defaultIncludeStill }))
  }, [defaultIncludeStill, dispatch])
  const toggleLoop = useCallback(
    () => dispatch(r.toggleLoop('BUTTON')),
    [dispatch]
  )
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
          <Tooltip
            title={`Create flashcard and start editing (${getKeyboardShortcut(
              'Start editing fields'
            )} key)`}
          >
            <IconButton className={css.editCardButton} onClick={startEditing}>
              <LibraryAdd />
            </IconButton>
          </Tooltip>
        </>
      }
      secondaryMenuItems={
        <>
          <Tooltip
            title={`Loop selection (${getKeyboardShortcut('Toggle loop')})`}
          >
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
