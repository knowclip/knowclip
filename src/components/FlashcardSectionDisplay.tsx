import React, {
  useCallback,
  ReactNodeArray,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  ReactChild,
} from 'react'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSectionDisplay.module.css'
import { TransliterationFlashcardFields } from '../types/Project'
import FieldMenu, {
  useSubtitlesBySource,
} from './FlashcardSectionFieldPopoverMenu'
import { Tooltip, IconButton, Button } from '@material-ui/core'
import { Add } from '@material-ui/icons'
import FlashcardDisplayField from './FlashcardSectionDisplayField'
import { useDispatch } from 'react-redux'

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
  clozeDeletions,
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
  // viewMode: ViewMode
}) => {
  // const tracksToFieldsText = cardBases.getFieldsPreviewFromCardsBase(
  //   cardBases.cards[chunkIndex]
  // )
  // const fields = {} as TransliterationFlashcardFields
  // for (const fieldName of cardBases.fieldNames) {
  //   const trackId = fieldsToTracks[fieldName]
  //   const text = trackId && tracksToFieldsText[trackId]
  //   fields[fieldName] = text || ''
  // }

  // const dispatch = useDispatch()
  // const startEditing = useCallback(
  //   () => {
  //     dispatch(r.startEditingCards())
  //   },
  //   [dispatch]
  // )

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
