import React, { useCallback, memo, ReactElement } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tooltip, IconButton } from '@material-ui/core'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import {
  FlashcardDisplayField,
  FlashcardDisplayFieldValue,
} from './FlashcardSectionDisplayPreview'
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
          >
            <EditTooltip>
              <FlashcardDisplayFieldValue
                fieldName="transcription"
                value={fields.transcription}
              />
            </EditTooltip>
          </FlashcardDisplayField>

          {'pronunciation' in fields && fields.pronunciation && (
            <FlashcardDisplayField
              fieldName="pronunciation"
              subtitles={mediaFile.subtitles}
              linkedTracks={fieldsToTracks}
              mediaFileId={mediaFile.id}
              onDoubleClick={handleDoubleClick}
            >
              <EditTooltip>
                <FlashcardDisplayFieldValue
                  fieldName="pronunciation"
                  value={fields.pronunciation}
                />
              </EditTooltip>
            </FlashcardDisplayField>
          )}
          <FlashcardDisplayField
            fieldName="meaning"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
            onDoubleClick={handleDoubleClick}
          >
            <EditTooltip>
              <FlashcardDisplayFieldValue
                fieldName="meaning"
                value={fields.meaning}
              />
            </EditTooltip>
          </FlashcardDisplayField>
          {fields.notes && (
            <FlashcardDisplayField
              fieldName="notes"
              subtitles={mediaFile.subtitles}
              linkedTracks={fieldsToTracks}
              mediaFileId={mediaFile.id}
              onDoubleClick={handleDoubleClick}
              className={cn(css.previewFieldNotes)}
            >
              {fields.notes}
            </FlashcardDisplayField>
          )}
        </section>
        <IconButton
          className={css.editCardButton}
          onClick={startEditing}
          id={$.editButton}
        >
          <Edit />
        </IconButton>
      </section>
    )
  }
)

const EditTooltip = ({ children }: { children: ReactElement<any> }) => {
  return <Tooltip title="Double-click to edit">{children}</Tooltip>
}

export default FlashcardSectionDisplayCard

export { $ as flashcardSectionDisplayCard$ }
