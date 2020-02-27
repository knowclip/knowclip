import React, { useCallback, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Tooltip } from '@material-ui/core'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import FlashcardDisplayField from './FlashcardSectionDisplayField'
import { Edit } from '@material-ui/icons'
import FlashcardSectionDisplay from './FlashcardSectionDisplay'
import { TransliterationFlashcardFields } from '../types/Project'

enum $ {
  container = 'flashcard-display-container',
  editButton = 'flashcard-display-edit-button',
}

const FlashcardSectionDisplayCard = memo(
  ({
    mediaFile,
    onDoubleClickField,
  }: {
    className?: string
    mediaFile: MediaFile
    clipId: ClipId
    onDoubleClickField?: (fieldName: FlashcardFieldName) => void
  }) => {
    const {
      selectedClipTime,
      fieldsToTracks,
      flashcard,
      viewMode,
    } = useSelector((state: AppState) => ({
      allTags: r.getAllTags(state),
      selectedClipTime: r.getSelectedClipTime(state),
      currentNoteType: r.getCurrentNoteType(state),
      isLoopOn: r.isLoopOn(state),
      fieldsToTracks: r.getSubtitlesFlashcardFieldLinks(state),
      flashcard: r.getHighlightedFlashcard(state),
      mediaIsPlaying: r.isMediaPlaying(state),
      viewMode: state.settings.viewMode,
    }))

    if (!selectedClipTime || !flashcard) throw new Error('Clip not found')

    const { fields: f } = flashcard
    const fields = f as TransliterationFlashcardFields

    const handleDoubleClick = useCallback(
      fieldName => {
        if (onDoubleClickField) onDoubleClickField(fieldName)
      },
      [onDoubleClickField]
    )

    const dispatch = useDispatch()
    const startEditing = useCallback(
      () => {
        dispatch(r.startEditingCards())
      },
      [dispatch]
    )
    const title = 'Double-click to edit'

    return (
      <FlashcardSectionDisplay
        className={css.preview}
        mediaFile={mediaFile}
        fieldsToTracks={fieldsToTracks}
        fields={fields}
        viewMode={viewMode}
        onDoubleClickField={handleDoubleClick}
        fieldHoverText={title}
        menuItems={
          <>
            <Tooltip title="Edit card (E key)">
              <IconButton
                className={css.editCardButton}
                onClick={startEditing}
                id={$.editButton}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          </>
        }
      />
    )
  }
)

export default FlashcardSectionDisplayCard

export { $ as flashcardSectionDisplayCard$ }
