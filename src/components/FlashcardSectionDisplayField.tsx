import React, {
  useCallback,
  ReactNodeArray,
  useRef,
  useLayoutEffect,
  useState,
} from 'react'
import cn from 'classnames'
import css from './FlashcardSectionDisplay.module.css'
import FieldMenu, {
  useSubtitlesBySource,
} from './FlashcardSectionFieldPopoverMenu'
import { Tooltip } from '@material-ui/core'
import { useSelector } from 'react-redux'

const FlashcardDisplayField = ({
  children,
  fieldName,
  subtitles,
  linkedTracks,
  mediaFileId,
  onDoubleClick,
  className,
  title,
  clozeMode = false,
}: {
  children: string | null
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
  onDoubleClick?: ((fieldName: FlashcardFieldName) => void)
  className?: string
  title?: string
  clozeMode?: boolean
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
      {clozeMode && fieldName === 'transcription' && children ? (
        <ClozeField fieldName={fieldName} value={children} title={title} />
      ) : (
        <FlashcardDisplayFieldValue
          fieldName={fieldName}
          value={children}
          title={title}
        />
      )}
    </div>
  )
}

const FlashcardDisplayFieldValue = ({
  fieldName,
  value,
  title,
}: {
  fieldName: FlashcardFieldName
  value: string | null
  title: string | undefined
}) => {
  const divRef = useRef<HTMLDivElement | null>(null)

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

  return (
    <span ref={divRef} onSelect={e => console.log(e)}>
      {withoutNewlines}
    </span>
  )
}

const ClozeField = ({
  fieldName,
  value,
  title,
}: {
  fieldName: FlashcardFieldName
  value: string
  title: string | undefined
}) => {
  const divRef = useRef<HTMLDivElement | null>(null)

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

  const div = (
    <span ref={divRef} onSelect={e => console.log(e)}>
      {withoutNewlines}
    </span>
  )

  const horizontal =
    useSelector((state: AppState) => state.settings.viewMode) === 'HORIZONTAL'

  const onCopy = useCallback(e => {
    const selection = window.getSelection()
    if (!selection) return
    var text = selection.toString().replace(/⏎/g, '\n')
    e.clipboardData.setData('text/plain', text)
    e.preventDefault()
  }, [])

  const content = (
    <div className={css.clozeFieldValue}>
      <textarea
        onCopy={onCopy}
        onCut={onCopy}
        className={css.clozeField}
        onSelect={e => console.log(e)}
        onKeyPress={e => e.preventDefault()}
        value={horizontal ? value.replace(/[\n\r]/g, '⏎') : value}
      />
      <div className={css.clozeTranscriptionText}>{withoutNewlines}</div>
    </div>
  )
  //  const withTooltip = title ? <Tooltip title={title}>{content}</Tooltip> : content
  return content
}

export default FlashcardDisplayField
