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
      className={cn(css.preview, {
        [css.horizontalPreview]: viewMode === 'HORIZONTAL',
      })}
    >
      <section className={cn(css.previewFields)}>
        <FlashcardDisplayField
          fieldName="transcription"
          subtitles={mediaFile.subtitles}
          linkedTracks={fieldsToTracks}
          mediaFileId={mediaFile.id}
        >
          <p
            className={cn(css.previewFieldValue, css.previewFieldTranscription)}
          >
            {chunkIndex != null && (
              <FlashcardDisplayFieldValue
                fieldName="transcription"
                value={fields.transcription}
              />
            )}
          </p>
        </FlashcardDisplayField>

        {'pronunciation' in fields && fields.pronunciation && (
          <FlashcardDisplayField
            fieldName="pronunciation"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
          >
            <p className={cn(css.previewFieldValue)}>
              {chunkIndex != null && (
                <FlashcardDisplayFieldValue
                  fieldName="pronunciation"
                  value={fields.pronunciation}
                />
              )}
            </p>
          </FlashcardDisplayField>
        )}
        <FlashcardDisplayField
          fieldName="meaning"
          subtitles={mediaFile.subtitles}
          linkedTracks={fieldsToTracks}
          mediaFileId={mediaFile.id}
        >
          <p className={cn(css.previewFieldValue)}>
            {chunkIndex != null && (
              <FlashcardDisplayFieldValue
                fieldName="meaning"
                value={fields.meaning}
              />
            )}
          </p>
        </FlashcardDisplayField>
        {fields.notes && (
          <FlashcardDisplayField
            fieldName="notes"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
          >
            <p className={cn(css.previewFieldValue)}>{fields.notes}</p>
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
    <>{value}</>
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
}: {
  children: ReactChild
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
  onDoubleClick?: ((fieldName: FlashcardFieldName) => void)
}) => {
  const {
    embeddedSubtitlesTracks,
    externalSubtitlesTracks,
  } = useSubtitlesBySource(subtitles)
  const linkedSubtitlesTrack = linkedTracks[fieldName] || null
  const handleDoubleClick = useCallback(
    () => {
      if (onDoubleClick) onDoubleClick(fieldName)
      console.log('dbcl!')
    },
    [fieldName, onDoubleClick]
  )
  return (
    <div className={css.previewField} onDoubleClick={handleDoubleClick}>
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
