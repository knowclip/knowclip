import React, { useCallback, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Tooltip } from '@material-ui/core'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import FlashcardDisplayField from './FlashcardSectionDisplayField'
import { Edit } from '@material-ui/icons'

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

    const { fields } = flashcard

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
      <section
        className={cn(css.container, {
          [css.horizontalPreview]: viewMode === 'HORIZONTAL',
        })}
        id={$.container}
      >
        <section className={cn(css.previewFields)}>
          <FlashcardDisplayField
            fieldName="transcription"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
            onDoubleClick={handleDoubleClick}
            className={cn(css.previewFieldTranscription)}
            title={title}
          >
            {fields.transcription}
          </FlashcardDisplayField>

          {'pronunciation' in fields && fields.pronunciation && (
            <FlashcardDisplayField
              fieldName="pronunciation"
              subtitles={mediaFile.subtitles}
              linkedTracks={fieldsToTracks}
              mediaFileId={mediaFile.id}
              onDoubleClick={handleDoubleClick}
              title={title}
            >
              {fields.pronunciation}
            </FlashcardDisplayField>
          )}
          <FlashcardDisplayField
            fieldName="meaning"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
            onDoubleClick={handleDoubleClick}
            title={title}
          >
            {fields.meaning}
          </FlashcardDisplayField>
          {fields.notes && (
            <FlashcardDisplayField
              fieldName="notes"
              subtitles={mediaFile.subtitles}
              linkedTracks={fieldsToTracks}
              mediaFileId={mediaFile.id}
              onDoubleClick={handleDoubleClick}
              className={cn(css.previewFieldNotes)}
              title={title}
            >
              {fields.notes}
            </FlashcardDisplayField>
          )}
        </section>

        <section className={css.menu}>
          <Tooltip title="Edit card (E key)">
            <IconButton
              className={css.editCardButton}
              onClick={startEditing}
              id={$.editButton}
            >
              <Edit />
            </IconButton>
          </Tooltip>
        </section>
      </section>
    )
  }
)

export default FlashcardSectionDisplayCard

export { $ as flashcardSectionDisplayCard$ }
