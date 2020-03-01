import React, { ReactChild } from 'react'
import cn from 'classnames'
import css from './FlashcardSectionDisplay.module.css'
import { TransliterationFlashcardFields } from '../types/Project'
import FlashcardDisplayField from './FlashcardSectionDisplayField'
import { ClozeTextInputActions } from '../utils/useClozeUi'

const empty: ClozeDeletion[] = []

const FlashcardSectionDisplay = ({
  // cardBases,
  // chunkIndex,
  mediaFile,
  fieldsToTracks,
  fields,
  viewMode,
  menuItems,
  className,
  onDoubleClickField,
  fieldHoverText,
  clozeIndex = -1,
  previewClozeIndex = -1,
  clozeDeletions = empty,
  fieldValueRef,
  clozeTextInputActions,
}: {
  fields: TransliterationFlashcardFields
  viewMode: ViewMode
  // clipsIds: string[]
  // cardBases: r.SubtitlesCardBases
  // chunkIndex: number
  mediaFile: MediaFile
  fieldsToTracks: SubtitlesFlashcardFieldsLinks
  menuItems: ReactChild
  className?: string
  onDoubleClickField?: (fn: TransliterationFlashcardFieldName) => void
  fieldHoverText?: string
  clozeIndex?: number
  previewClozeIndex?: number
  clozeDeletions?: ClozeDeletion[]
  confirmSelection?: (e: any) => void
  fieldValueRef: React.RefObject<HTMLSpanElement>
  clozeTextInputActions?: ClozeTextInputActions
  // viewMode: ViewMode
}) => {
  return (
    <section
      className={cn(css.container, className, {
        [css.horizontalPreview]: viewMode === 'HORIZONTAL',
      })}
    >
      <section className={cn(css.previewFields)}>
        <FlashcardDisplayField
          fieldName="transcription"
          subtitles={mediaFile.subtitles}
          linkedTracks={fieldsToTracks}
          mediaFileId={mediaFile.id}
          onDoubleClick={onDoubleClickField}
          title={fieldHoverText}
          className={cn(css.previewFieldTranscription)}
          clozeIndex={clozeIndex}
          previewClozeIndex={previewClozeIndex}
          clozeDeletions={clozeDeletions}
          fieldValueRef={fieldValueRef}
          clozeTextInputActions={clozeTextInputActions}
        >
          {fields.transcription || null}
        </FlashcardDisplayField>

        {'pronunciation' in fields && fields.pronunciation && (
          <FlashcardDisplayField
            fieldName="pronunciation"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
            onDoubleClick={onDoubleClickField}
            title={fieldHoverText}
            className={css.previewFieldPronunciation}
          >
            {fields.pronunciation}
          </FlashcardDisplayField>
        )}
        <FlashcardDisplayField
          fieldName="meaning"
          subtitles={mediaFile.subtitles}
          linkedTracks={fieldsToTracks}
          mediaFileId={mediaFile.id}
          onDoubleClick={onDoubleClickField}
          title={fieldHoverText}
        >
          {fields.meaning || null}
        </FlashcardDisplayField>
        {fields.notes && (
          <FlashcardDisplayField
            fieldName="notes"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
            onDoubleClick={onDoubleClickField}
            title={fieldHoverText}
            className={cn(css.previewFieldNotes)}
          >
            {fields.notes}
          </FlashcardDisplayField>
        )}
      </section>

      <section className={css.menu}>{menuItems}</section>
    </section>
  )
}

export default FlashcardSectionDisplay
