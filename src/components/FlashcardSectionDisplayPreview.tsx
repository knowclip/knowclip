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
export const FlashcardDisplayFieldValue = ({
  fieldName,
  value,
  title,
}: {
  fieldName: FlashcardFieldName
  value: string | null
  title: string | undefined
}) => {
  const spanRef = useRef<HTMLSpanElement | null>(null)

  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  useLayoutEffect(
    () => {
      if (spanRef.current) {
        const rect = spanRef.current.getBoundingClientRect()
        setWidth(rect.width + 16)
        setHeight(rect.height + 7)
      }
    },
    [value]
  )

  if (!value)
    return title ? (
      <Tooltip title={title}>
        <span className={css.emptyFieldPlaceholder}>{fieldName}</span>
      </Tooltip>
    ) : (
      <span className={css.emptyFieldPlaceholder}>{fieldName}</span>
    )

  const withoutNewlines: ReactNodeArray = []
  const lines = value.split('\n')
  lines.forEach((line, i) => {
    if (i !== 0)
      withoutNewlines.push(
        <span className={css.newlinePlaceholder} key={String(i)}>
          <span className={css.newline}>{'\n'}</span>
        </span>
      )
    withoutNewlines.push(line)
  })

  const contenta = (
    <span ref={spanRef} onSelect={e => console.log(e)}>
      {withoutNewlines}
    </span>
  )
  const content = (
    <textarea
      style={{ width: width + 'px', height: height + 'px' }}
      className={css.clozeField}
      onSelect={e => console.log(e)}
      value={value.replace(/\n/g, '⏎')}
      onKeyPress={e => e.preventDefault()}
    />
  )

  return (
    <>
      {title ? <Tooltip title={title}>{content}</Tooltip> : content}
      {contenta}
    </>
  )
}
export const FlashcardDisplayField = ({
  children,
  fieldName,
  subtitles,
  linkedTracks,
  mediaFileId,
  onDoubleClick,
  className,
  title,
}: {
  children: string | null
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
  onDoubleClick?: ((fieldName: FlashcardFieldName) => void)
  className?: string
  title?: string
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
      className={cn(css.previewField, className, {
        [css.previewFieldWithPopover]: Boolean(subtitles.length),
      })}
      onDoubleClick={handleDoubleClick}
    >
      {Boolean(subtitles.length) && (
        <FieldMenu
          className={css.previewFieldMenuButton}
          embeddedSubtitlesTracks={embeddedSubtitlesTracks}
          externalSubtitlesTracks={externalSubtitlesTracks}
          linkedSubtitlesTrack={linkedSubtitlesTrack}
          mediaFileId={mediaFileId}
          fieldName={fieldName as TransliterationFlashcardFieldName}
        />
      )}
      <FlashcardDisplayFieldValue
        fieldName={fieldName}
        value={children}
        title={title}
      />
    </div>
  )
}

export default FlashcardSectionPreview
