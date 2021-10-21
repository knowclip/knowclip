import React, { useCallback, ReactNodeArray, ReactNode } from 'react'
import cn from 'classnames'
import css from './FlashcardSectionDisplay.module.css'
import FieldMenu from './FlashcardSectionFieldPopoverMenu'
import { Tooltip } from '@material-ui/core'

const FlashcardDisplayField = ({
  children,
  fieldName,
  subtitles,
  linkedTracks,
  mediaFileId,
  onDoubleClick,
  className,
  title,
  fieldValueRef,
}: {
  children: string | null
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
  onDoubleClick?: (fieldName: FlashcardFieldName) => void
  className?: string
  title?: string
  fieldValueRef?: React.RefObject<HTMLSpanElement>
}) => {
  const handleDoubleClick = useCallback(() => {
    if (onDoubleClick) onDoubleClick(fieldName)
  }, [fieldName, onDoubleClick])

  const linkedSubtitlesTrack = linkedTracks[fieldName] || null
  const subtitlesMenu = Boolean(subtitles.length) && (
    <FieldMenu
      className={css.previewFieldMenuButton}
      linkedSubtitlesTrack={linkedSubtitlesTrack}
      mediaFileId={mediaFileId}
      fieldName={fieldName as TransliterationFlashcardFieldName}
    />
  )

  return (
    <div
      className={cn(css.previewField, className, {
        [css.previewFieldWithPopover]: Boolean(subtitles.length),
      })}
      onDoubleClick={handleDoubleClick}
    >
      {subtitlesMenu}
      <FlashcardDisplayFieldValue
        fieldName={fieldName}
        value={children}
        title={title}
        fieldValueRef={fieldValueRef}
      />
    </div>
  )
}

const FlashcardDisplayFieldValue = ({
  fieldName,
  value,
  title,
  fieldValueRef,
}: {
  fieldName: FlashcardFieldName
  value: string | null
  title: string | undefined
  clozeIndex?: number
  fieldValueRef?: React.RefObject<HTMLSpanElement>
}) => {
  if (!value)
    return title ? (
      <Tooltip title={title}>
        <span className={css.emptyFieldPlaceholder}>{fieldName}</span>
      </Tooltip>
    ) : (
      <span className={css.emptyFieldPlaceholder}>{fieldName}</span>
    )

  const withoutNewlines: ReactNode[] = []
  const lines = value.split(/[\n\r]/)
  lines.forEach((line, i) => {
    if (i !== 0)
      withoutNewlines.push(
        <span className={css.newlinePlaceholder} key={String(i)}>
          <span className={css.newline}>{'\n'}</span>
        </span>
      )
    withoutNewlines.push(line)
  })

  return (
    <span ref={fieldValueRef} className={css.fieldValue}>
      {withoutNewlines}
    </span>
  )
}

export default FlashcardDisplayField
