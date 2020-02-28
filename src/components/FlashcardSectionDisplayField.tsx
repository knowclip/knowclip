import React, {
  useCallback,
  ReactNodeArray,
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  ReactNode,
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
  clozeIndex = -1,
  clozeDeletions,
  previewClozeIndex,
}: {
  children: string | null
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
  onDoubleClick?: ((fieldName: FlashcardFieldName) => void)
  className?: string
  title?: string
  clozeIndex?: number
  clozeDeletions?: ClozeDeletion[]
  previewClozeIndex?: number
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

  const subtitlesMenu = Boolean(subtitles.length) && (
    <FieldMenu
      className={css.previewFieldMenuButton}
      embeddedSubtitlesTracks={embeddedSubtitlesTracks}
      externalSubtitlesTracks={externalSubtitlesTracks}
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
      {typeof clozeIndex === 'number' &&
      clozeIndex !== -1 &&
      fieldName === 'transcription' &&
      children ? (
        <div className={css.clozeField}>
          <ClozeField
            fieldName={fieldName}
            value={children}
            title={title}
            clozeIndex={clozeIndex}
            deletions={clozeDeletions || []}
            subtitlesMenu={subtitlesMenu}
            previewClozeIndex={previewClozeIndex}
          />
        </div>
      ) : (
        <>
          {subtitlesMenu}
          <FlashcardDisplayFieldValue
            fieldName={fieldName}
            value={children}
            title={title}
          />
        </>
      )}
    </div>
  )
}

const FlashcardDisplayFieldValue = ({
  fieldName,
  value,
  title,
  clozeIndex,
}: {
  fieldName: FlashcardFieldName
  value: string | null
  title: string | undefined
  clozeIndex?: number
}) => {
  const divRef = useRef<HTMLDivElement | null>(null)

  // const preventDefault = useCallback(e => {
  //   console.log({ e })
  //   e.preventDefault()
  // }, [])

  // const blur = useCallback(e => {
  //   e.target.blur()
  // }, []) //

  if (!value)
    return title ? (
      <Tooltip title={title}>
        <span className={css.emptyFieldPlaceholder}>{fieldName}</span>
      </Tooltip>
    ) : (
      <span className={css.emptyFieldPlaceholder}>{fieldName}</span>
    )

  const withoutNewlines: ReactNodeArray = []
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
    <div
      ref={divRef}
      // contentEditable
      // tabIndex={-1}
      // onFocus={blur}
      // onKeyDown={preventDefault}
      className={css.fieldValue}
    >
      {withoutNewlines}
    </div>
  )
}

export type ClozeId = 'c1' | 'c2' | 'c3' | 'c4' | 'c5'
export const ClozeIds = ['c1', 'c2', 'c3', 'c4', 'c5'] as const
export const ClozeColors = {
  c1: '#8080ff',
  c2: '#00ff00',
  c3: '#ffff00',
  c4: '#00ffff',
  c5: '#ff00ff',
} as const

const ClozeField = ({
  fieldName,
  value,
  title,
  clozeIndex,
  previewClozeIndex,
  deletions,
  subtitlesMenu,
}: // textAreaRef,
{
  fieldName: FlashcardFieldName
  value: string
  title: string | undefined
  clozeIndex: number
  previewClozeIndex?: number
  deletions: ClozeDeletion[]
  subtitlesMenu: ReactNode
  // textAreaRef: React.RefObject<HTMLTextAreaElement>
}) => {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    console.log({ ref })
    if (ref.current) ref.current.focus()
  }, [])

  const clearNewlines = (value: string, className?: string) => {
    const withoutNewlines: ReactNodeArray = []
    const lines = value.split(/[\n\r]/)
    lines.forEach((line, i) => {
      if (i !== 0)
        withoutNewlines.push(
          <span
            className={cn(css.clozeNewlinePlaceholder, className)}
            key={String(i)}
          >
            ⏎
          </span>
        )
      withoutNewlines.push(<span className={className}>{line}</span>)
    })
    return withoutNewlines
  }
  const clozeId = ClozeIds[clozeIndex]
  const withoutNewlines = clearNewlines(value, clozeId)
  const horizontal =
    useSelector((state: AppState) => state.settings.viewMode) === 'HORIZONTAL'

  const onCopy = useCallback(e => {
    const selection = window.getSelection()
    if (!selection) return
    var text = selection.toString().replace(/⏎/g, '\n')
    e.clipboardData.setData('text/plain', text)
    e.preventDefault()
  }, [])

  const onKeyDown = useCallback(e => {
    console.log({ e })
    console.log(e.target.innerText)
    if (!isEnabledKey(e.keyCode, e.ctrlKey)) e.preventDefault()

    // e.target.innerText = horizontal ? value.replace(/[\n\r]/g, '⏎') : value
  }, [])
  const preventDefault = useCallback(e => {
    console.log({ e })
    e.preventDefault()
  }, [])

  const content = (
    <>
      {deletions
        // .filter(d => d.clozeId === clozeId)
        .map(({ ranges, clozeId: id }, clozeIndex) => {
          return (
            <span className={cn(css.clozeUnderlay, id)} contentEditable>
              {ranges.reduce(
                (elements, { start, end }, i) => {
                  // const lastEnd  ranges[i - 1].end
                  if (i === 0 && start > 0)
                    elements.push(clearNewlines(value.slice(0, start))) // + 1?

                  elements.push(
                    <span
                      className={cn(css.clozeUnderlayDeletion, {
                        [css.currentClozeUnderlayDeletion]: id === clozeId,
                        [css.previewBlank]: clozeIndex === previewClozeIndex,
                      })}
                    >
                      {clearNewlines(value.slice(start, end))}
                    </span>
                  )
                  const nextStart = ranges[i + 1]
                    ? ranges[i + 1].start
                    : value.length // + 1?
                  if (nextStart - end > 0)
                    elements.push(clearNewlines(value.slice(end, nextStart))) // + 1?

                  return elements
                },
                [] as ReactNode[]
              )}
            </span>
          )
        })}
      {/* <textarea
        ref={textArea}
        onCopy={onCopy}
        onCut={onCopy}
        className={css.clozeField}
        onSelect={e => console.log(e)}
        onKeyPress={e => e.preventDefault()}
        value={horizontal ? value.replace(/[\n\r]/g, '⏎') : value}
      /> */}
      {/* <span
        onPaste={preventDefault}
        onCut={preventDefault}
        onKeyDown={onKeyDown}
        style={{ position: 'absolute', color: 'blue' }}
        onSelect={e => {
          console.log('select', e)
        }}
        onCopy={onCopy}
      >
        {withoutNewlines}
      </span> */}
      {/* {horizontal ? value.replace(/[\n\r]/g, '⏎') : value} */}
      {subtitlesMenu}
      <span
        className={cn(css.clozeFieldValue, clozeId)}
        contentEditable
        onPaste={preventDefault}
        onCut={preventDefault}
        onKeyDown={onKeyDown}
        onDragEnd={preventDefault}
        onDragExit={preventDefault}
        onDragOver={preventDefault}
        onSelect={e => {
          console.log('select', e)
        }}
        // style={{ caretColor: ClozeColors[ClozeIds[clozeIndex]] }}
        onCopy={onCopy}
        ref={ref}
      >
        <span className={cn(css.clozeFieldValueOverlay, clozeId)}>
          {withoutNewlines}
        </span>
      </span>
    </>
  )
  //  const withTooltip = title ? <Tooltip title={title}>{content}</Tooltip> : content
  const clozeHint =
    'Select the text you wish to blank out.\nTrim selection with Backspace, complete with Enter.'
  return <Tooltip title={clozeHint}>{content}</Tooltip>
}

const ENABLED_KEYS = [
  9, // tab
  16, // shift
  37, // left
  39, // right
]
const ENABLED_CTRL_KEYS = [
  ...ENABLED_KEYS,
  67, // c
  65, // a
]
const isEnabledKey = (keyCode: number, ctrlKey: boolean) =>
  ctrlKey ? ENABLED_CTRL_KEYS.includes(keyCode) : ENABLED_KEYS.includes(keyCode)

export default FlashcardDisplayField
