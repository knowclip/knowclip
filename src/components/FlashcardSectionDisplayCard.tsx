import React, { useCallback, memo } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Tooltip } from '@material-ui/core'
import r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import { Edit, Photo, Delete, Loop } from '@material-ui/icons'
import FlashcardSectionDisplay from './FlashcardSectionDisplay'
import { TransliterationFlashcardFields } from '../types/Project'
import useClozeControls from '../utils/clozeField/useClozeControls'
import ClozeButtons from './FlashcardSectionDisplayClozeButtons'
import { getKeyboardShortcut } from './KeyboardShortcuts'

enum $ {
  container = 'flashcard-display-container',
  editButton = 'flashcard-display-edit-button',
}

const FlashcardSectionDisplayCard = memo(
  ({
    mediaFile,
    onDoubleClickField,
    flashcard,
    className,
  }: {
    className?: string
    mediaFile: MediaFile
    flashcard: Flashcard
    clipId: ClipId
    onDoubleClickField?: (fieldName: FlashcardFieldName) => void
  }) => {
    const { fieldsToTracks, viewMode, isLoopOn } = useSelector(
      (state: AppState) => ({
        allTags: r.getAllTags(state),
        currentNoteType: r.getCurrentNoteType(state),
        isLoopOn: r.getLoopState(state),
        fieldsToTracks: r.getSubtitlesFlashcardFieldLinks(state),
        mediaIsPlaying: r.isMediaPlaying(state),
        viewMode: state.settings.viewMode,
      })
    )

    const { fields: f } = flashcard
    const fields = f as TransliterationFlashcardFields

    const handleDoubleClick = useCallback(
      (fieldName) => {
        if (onDoubleClickField) onDoubleClickField(fieldName)
      },
      [onDoubleClickField]
    )

    const dispatch = useDispatch()
    const startEditing = useCallback(() => {
      dispatch(r.startEditingCards())
    }, [dispatch])

    const toggleIncludeStill = useCallback(() => {
      dispatch(
        r.editClip(flashcard.id, null, {
          image: flashcard.image
            ? null
            : { type: 'VideoStillImage', id: flashcard.id },
        })
      )
    }, [dispatch, flashcard.id, flashcard.image])

    const deleteClipAndCard = useCallback(() => {
      dispatch(
        r.confirmationDialog(
          'Are you sure you want to delete this clip and flashcard?',
          r.deleteCard(flashcard.id)
        )
      )
    }, [dispatch, flashcard.id])

    const clozeControls = useClozeControls({
      deletions: flashcard.cloze,
      onNewClozeCard: useCallback(
        (deletion) => {
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
        (clozeIndex) => {
          dispatch(
            r.removeClozeDeletion(flashcard.id, flashcard.cloze, clozeIndex)
          )
        },
        [dispatch, flashcard.cloze, flashcard.id]
      ),
    })
    const toggleLoop = useCallback(() => dispatch(r.toggleLoop('BUTTON')), [
      dispatch,
    ])

    return (
      <FlashcardSectionDisplay
        className={cn(className, css.card)}
        mediaFile={mediaFile}
        fieldsToTracks={fieldsToTracks}
        fields={fields}
        viewMode={viewMode}
        onDoubleClickField={handleDoubleClick}
        clozeControls={clozeControls}
        menuItems={
          <>
            {fields.transcription.trim() && (
              <ClozeButtons controls={clozeControls} />
            )}
            <Tooltip
              title={`Edit card (${getKeyboardShortcut(
                'Start editing fields'
              )} key)`}
            >
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
                  flashcard.image
                    ? 'Click to leave out image'
                    : 'Click to include image'
                }
              >
                <IconButton
                  className={css.editCardButton}
                  onClick={toggleIncludeStill}
                  style={{
                    color: flashcard.image ? 'rgba(0, 0, 0, 0.54)' : '#ddd',
                  }}
                >
                  <Photo />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete clip and flashcard">
              <IconButton onClick={deleteClipAndCard}>
                <Delete />
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
