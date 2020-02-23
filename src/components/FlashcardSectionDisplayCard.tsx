import React, { useCallback, memo, ReactElement } from 'react'
import { useSelector } from 'react-redux'
import { Tooltip } from '@material-ui/core'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import {
  FlashcardDisplayField,
  FlashcardDisplayFieldValue,
} from './FlashcardSectionDisplayPreview'

enum $ {
  container = 'flashcard-display-container',
}

const FlashcardSectionCardDisplay = memo(
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

    return (
      <section
        className={cn(css.container, {
          [css.horizontalPreview]: viewMode === 'HORIZONTAL',
        })}
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
            >
              {fields.notes}
            </FlashcardDisplayField>
          )}
        </section>
      </section>
    )
  }
)

const EditTooltip = ({ children }: { children: ReactElement<any> }) => {
  return <Tooltip title="Double-click to edit">{children}</Tooltip>
}

export default FlashcardSectionCardDisplay

export { $ as flashcardSectionForm$ }
