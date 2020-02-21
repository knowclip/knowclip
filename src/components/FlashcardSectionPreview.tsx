import React, { ReactChild } from 'react'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSection.module.css'
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
        <Field
          fieldName="transcription"
          subtitles={mediaFile.subtitles}
          linkedTracks={fieldsToTracks}
          mediaFileId={mediaFile.id}
        >
          <p
            className={cn(css.previewFieldValue, css.previewFieldTranscription)}
          >
            {chunkIndex != null && (
              <FieldValue
                fieldName="transcription"
                value={fields.transcription}
              />
            )}
          </p>
        </Field>

        {'pronunciation' in fields && fields.pronunciation && (
          <Field
            fieldName="pronunciation"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
          >
            <p className={cn(css.previewFieldValue)}>
              {chunkIndex != null && (
                <FieldValue
                  fieldName="pronunciation"
                  value={fields.pronunciation}
                />
              )}
            </p>
          </Field>
        )}
        <Field
          fieldName="meaning"
          subtitles={mediaFile.subtitles}
          linkedTracks={fieldsToTracks}
          mediaFileId={mediaFile.id}
        >
          <p className={cn(css.previewFieldValue)}>
            {chunkIndex != null && (
              <FieldValue fieldName="meaning" value={fields.meaning} />
            )}
          </p>
        </Field>
        {fields.notes && (
          <Field
            fieldName="notes"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
          >
            <p className={cn(css.previewFieldValue)}>{fields.notes}</p>
          </Field>
        )}
      </section>
    </section>
  )
}
const FieldValue = ({
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

const Field = ({
  children,
  fieldName,
  subtitles,
  linkedTracks,
  mediaFileId,
}: {
  children: ReactChild
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
}) => {
  const {
    embeddedSubtitlesTracks,
    externalSubtitlesTracks,
  } = useSubtitlesBySource(subtitles)
  const linkedSubtitlesTrack = linkedTracks[fieldName] || null
  return (
    <div className={css.previewField}>
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
