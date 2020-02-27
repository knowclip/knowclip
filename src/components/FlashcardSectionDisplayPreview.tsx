import React, {
  useCallback,
  ReactNodeArray,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
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

  const dispatch = useDispatch()
  const startEditing = useCallback(
    () => {
      dispatch(r.startEditingCards())
    },
    [dispatch]
  )

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
          {fields.transcription || null}
        </FlashcardDisplayField>

        {'pronunciation' in fields && fields.pronunciation && (
          <FlashcardDisplayField
            fieldName="pronunciation"
            subtitles={mediaFile.subtitles}
            linkedTracks={fieldsToTracks}
            mediaFileId={mediaFile.id}
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
        >
          {fields.meaning || null}
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

      <section className={css.menu}>
        <Tooltip title="Create cloze deletion (C key)">
          <Button
            className={css.clozeButton}
            onClick={startEditing}
            color="primary"
            variant="contained"
          >
            C1
          </Button>
        </Tooltip>

        <Tooltip title="Create flashcard from these subtitles (E key)">
          <IconButton className={css.editCardButton} onClick={startEditing}>
            <Add />
          </IconButton>
        </Tooltip>
      </section>
    </section>
  )
}

export default FlashcardSectionPreview
