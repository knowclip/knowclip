import React, { useCallback, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Tooltip } from '@material-ui/core'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import { Edit } from '@material-ui/icons'
import FlashcardSectionDisplay from './FlashcardSectionDisplay'
import { TransliterationFlashcardFields } from '../types/Project'
import useClozeControls from '../utils/useClozeUi'
import ClozeButtons from './FlashcardSectionDisplayClozeButtons'

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

    const clozeControls = useClozeControls({
      deletions: flashcard.cloze,
      onNewClozeCard: useCallback(
        deletion => {
          dispatch(
            r.addClozeDeletion(flashcard.id, flashcard.cloze || [], deletion)
          )
        },
        [dispatch, flashcard.cloze, flashcard.id]
      ),
      onEditClozeCard: useCallback(
        (clozeIndex, ranges) => {
          dispatch(
            r.editClozeDeletion(
              flashcard.id,
              flashcard.cloze,
              clozeIndex,
              ranges
            )
          )
        },
        [dispatch, flashcard.cloze, flashcard.id]
      ),
      onDeleteClozeCard: useCallback(
        clozeIndex => {
          dispatch(
            r.removeClozeDeletion(flashcard.id, flashcard.cloze, clozeIndex)
          )
        },
        [dispatch, flashcard.cloze, flashcard.id]
      ),
    })

    return (
      <FlashcardSectionDisplay
        className={css.card}
        mediaFile={mediaFile}
        fieldsToTracks={fieldsToTracks}
        fields={fields}
        viewMode={viewMode}
        onDoubleClickField={handleDoubleClick}
        clozeControls={clozeControls}
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
            {fields.transcription.trim() && (
              <ClozeButtons controls={clozeControls} />
            )}
          </>
        }
      />
    )
  }
)

export default FlashcardSectionDisplayCard

export { $ as flashcardSectionDisplayCard$ }
