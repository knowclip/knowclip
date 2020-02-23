import React, {
  useCallback,
  useState,
  useEffect,
  memo,
  useRef,
  ReactNode,
  ReactChild,
  ReactElement,
} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core'
import { Delete as DeleteIcon, Loop } from '@material-ui/icons'
import cn from 'classnames'
import formatTime from '../utils/formatTime'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import { getNoteTypeFields } from '../utils/noteType'
import TagsInput from './TagsInput'
import VideoStillDisplay from './FlashcardSectionFormVideoStill'
import * as actions from '../actions'
import Field from './FlashcardSectionFormField'
import {
  FlashcardDisplayField,
  FlashcardDisplayFieldValue,
} from './FlashcardSectionDisplayPreview'

enum $ {
  container = 'flashcard-display-container',
}

const FIELD_INPUT_PROPS = {
  style: { minHeight: '20px' },
}

const FlashcardSectionCardDisplay = memo(
  ({
    className,
    mediaFile,
    onDoubleClickField,
  }: {
    className?: string
    mediaFile: MediaFile
    clipId: ClipId
    onDoubleClickField?: (fieldName: FlashcardFieldName) => void
  }) => {
    const {
      allTags,
      selectedClipTime,
      currentNoteType,
      isLoopOn,
      fieldsToTracks,
      flashcard,
      mediaIsPlaying,
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
