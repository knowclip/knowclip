import React, { ReactChild, useCallback } from 'react'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import { TransliterationFlashcardFields } from '../types/Project'
import FieldMenu, {
  useSubtitlesBySource,
} from './FlashcardSectionFormFieldPopoverMenu'

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

  return (
    <section
      className={cn(css.container, css.preview, {
        [css.horizontalPreview]: viewMode === 'HORIZONTAL',
      })}
    >
      <section className={cn(css.previewFields)}>
        <FlashcardDisplayField
          fieldName="transcription"
          subtitles={mediaFile.subtitles}
          linkedTracks={fieldsToTracks}
          mediaFileId={mediaFile.id}
          className={cn(css.previewFieldTranscription)}
        >
          {chunkIndex != null ? (
            <FlashcardDisplayFieldValue
              fieldName="transcription"
              value={fields.transcription}
            />
          ) : null}
        </FlashcardDisplayField>

        {'pronunciation' in fields && fields.pronunciation && (
          <FlashcardDisplayField
            fieldName="pronunciation"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
          >
            {chunkIndex != null ? (
              <FlashcardDisplayFieldValue
                fieldName="pronunciation"
                value={fields.pronunciation}
              />
            ) : null}
          </FlashcardDisplayField>
        )}
        <FlashcardDisplayField
          fieldName="meaning"
          subtitles={mediaFile.subtitles}
          linkedTracks={fieldsToTracks}
          mediaFileId={mediaFile.id}
        >
          {chunkIndex != null ? (
            <FlashcardDisplayFieldValue
              fieldName="meaning"
              value={fields.meaning}
            />
          ) : null}
        </FlashcardDisplayField>
        {fields.notes && (
          <FlashcardDisplayField
            fieldName="notes"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
            className={cn(css.previewFieldNotes)}
          >
            {fields.notes}
          </FlashcardDisplayField>
        )}
      </section>
    </section>
  )
}
export const FlashcardDisplayFieldValue = ({
  fieldName,
  value,
}: {
  fieldName: FlashcardFieldName
  value: string | null
}) =>
  value ? (
    <span>{value}</span>
  ) : (
    <span className={css.emptyFieldPlaceholder}>{fieldName}</span>
  )

export const FlashcardDisplayField = ({
  children,
  fieldName,
  subtitles,
  linkedTracks,
  mediaFileId,
  onDoubleClick,
  className,
}: {
  children: ReactChild | null
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
  onDoubleClick?: ((fieldName: FlashcardFieldName) => void)
  className?: string
}) => {
  const {
    embeddedSubtitlesTracks,
    externalSubtitlesTracks,
  } = useSubtitlesBySource(subtitles)
  const linkedSubtitlesTrack = linkedTracks[fieldName] || null
  const handleDoubleClick = useCallback(
    () => {
      if (onDoubleClick) onDoubleClick(fieldName)
    },
    [fieldName, onDoubleClick]
  )
  return (
    <div
      className={cn(css.previewField, className)}
      onDoubleClick={handleDoubleClick}
    >
      <FieldMenu
        className={css.previewFieldMenuButton}
        embeddedSubtitlesTracks={embeddedSubtitlesTracks}
        externalSubtitlesTracks={externalSubtitlesTracks}
        linkedSubtitlesTrack={linkedSubtitlesTrack}
        mediaFileId={mediaFileId}
        fieldName={fieldName as TransliterationFlashcardFieldName}
      />
      {children}
    </div>
  )
}

export default FlashcardSectionPreview
