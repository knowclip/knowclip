import React, { useCallback, ReactNodeArray, useEffect, ReactNode } from 'react'
import cn from 'classnames'
import css from './FlashcardSectionDisplay.module.css'
import FieldMenu, {
  useSubtitlesBySource,
} from './FlashcardSectionFieldPopoverMenu'
import { Tooltip } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { getSelectionWithin, ClozeTextInputActions } from '../utils/useClozeUi'

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
  fieldValueRef,
  clozeTextInputActions,
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
  fieldValueRef?: React.RefObject<HTMLSpanElement>
  clozeTextInputActions?: ClozeTextInputActions
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
  const viewMode = useSelector((state: AppState) => state.settings.viewMode)

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
      {clozeDeletions && children && fieldValueRef ? (
        <div className={css.clozeField}>
          {clozeDeletions && (
            <ClozeUnderlay
              deletions={clozeDeletions}
              clozeId={ClozeIds[clozeIndex]}
              previewClozeIndex={previewClozeIndex}
              value={children}
              viewMode={viewMode}
              editing={clozeIndex !== -1}
            />
          )}
          {clozeTextInputActions && (
            <ClozeField
              fieldName={fieldName}
              value={children}
              title={title}
              clozeIndex={clozeIndex}
              deletions={clozeDeletions || []}
              subtitlesMenu={subtitlesMenu}
              previewClozeIndex={previewClozeIndex}
              fieldValueRef={fieldValueRef}
              clozeTextInputActions={clozeTextInputActions}
            />
          )}
        </div>
      ) : (
        <>
          {subtitlesMenu}
          <FlashcardDisplayFieldValue
            fieldName={fieldName}
            value={children}
            title={title}
            fieldValueRef={fieldValueRef}
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
    <span ref={fieldValueRef} className={css.fieldValue}>
      {withoutNewlines}
    </span>
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

const clearNewlines = (
  value: string,
  viewMode: ViewMode,
  className?: string
) => {
  const char = viewMode === 'VERTICAL' ? '\n' : '⏎'
  const withoutNewlines: ReactNodeArray = []
  const lines = value.split(/[\n\r]/)
  lines.forEach((line, i) => {
    if (i !== 0)
      withoutNewlines.push(
        <span
          className={cn(css.clozeNewlinePlaceholder, className)}
          key={String(i)}
        >
          {char}
        </span>
      )
    withoutNewlines.push(<span className={className}>{line}</span>)
  })
  return withoutNewlines
}

let shiftKeyHeld = false
const ClozeField = ({
  fieldName,
  value,
  title,
  clozeIndex,
  previewClozeIndex,
  deletions,
  subtitlesMenu,
  fieldValueRef: ref,
  clozeTextInputActions: {
    onSelect,
    onBackspace,
    onPressDelete,
    onEnter,
    onEscape,
  },
}: // confirmSelection,
// textAreaRef,
{
  fieldName: FlashcardFieldName
  value: string
  title: string | undefined
  clozeIndex: number
  previewClozeIndex?: number
  deletions: ClozeDeletion[]
  subtitlesMenu: ReactNode
  fieldValueRef: React.RefObject<HTMLSpanElement>
  clozeTextInputActions: ClozeTextInputActions
}) => {
  useEffect(
    () => {
      if (ref.current) {
        const selection = window.getSelection()
        if (selection) selection.empty()
        ref.current.focus()
      }
    },
    [clozeIndex, ref]
  )

  const clozeId = ClozeIds[clozeIndex]
  const viewMode = useSelector((state: AppState) => state.settings.viewMode)

  const withoutNewlines = clearNewlines(value, viewMode, clozeId)

  const onCopy = useCallback(e => {
    const selection = window.getSelection()
    if (!selection) return
    var text = selection.toString().replace(/⏎/g, '\n')
    e.clipboardData.setData('text/plain', text)
    e.preventDefault()
  }, [])

  const editing = clozeIndex !== -1

  const onKeyDown = useCallback(
    e => {
      if (!isEnabledKey(e.keyCode, e.ctrlKey)) e.preventDefault()
      switch (e.keyCode) {
        // enter
        case 13: {
          e.preventDefault()
          onEnter()
          break
        }
        // delete
        case 46: {
          if (ref.current) {
            const selection = getSelectionWithin(ref.current)
            // if/ (selection.start !== selection.end || select
            onPressDelete(selection)
          }
          break
        }
        // backspace
        case 8: {
          if (ref.current) {
            const selection = getSelectionWithin(ref.current)
            onBackspace(selection)
          }
          break
        }
        // shift
        case 16:
          return (shiftKeyHeld = true)

        // escape
        case 27:
          onEscape()
          return e.stopPropagation()

        default:
      }
    },
    // [confirmSelection]
    [onBackspace, onEnter, onEscape, onPressDelete, ref]
  )
  const preventDefault = useCallback(e => {
    e.preventDefault()
  }, [])
  const handleSelect = useCallback(
    e => {
      if (!shiftKeyHeld) {
        console.log(e.target)
        const selection = getSelectionWithin(e.target)
        if (selection.start === selection.end) return
        onSelect(selection)
      }
    },
    [onSelect]
  )
  const handleKeyUp = useCallback(
    e => {
      // shift key
      if (e.keyCode === 16) {
        shiftKeyHeld = false
        const selection = getSelectionWithin(e.target)
        if (selection.start === selection.end) return
        onSelect(selection)
      }
    },
    [onSelect]
  )

  const clozeHint = (
    <>
      Select the text you wish to blank out.
      <br />
      <br />
      Hit Backspace to trim selection.
      <br />
      <br />
      Hit Enter when finished.
    </>
  )

  const content = (
    <span
      className={cn(css.clozeFieldValue, clozeId)}
      contentEditable={editing}
      suppressContentEditableWarning
      onKeyDown={onKeyDown}
      onPaste={preventDefault}
      onCut={preventDefault}
      onDragEnd={preventDefault}
      onDragExit={preventDefault}
      onDragOver={preventDefault}
      onSelect={handleSelect}
      onKeyUp={handleKeyUp}
      onCopy={onCopy}
      ref={ref}
    >
      {withoutNewlines}
    </span>
  )

  return (
    <>
      {subtitlesMenu}
      {editing ? <Tooltip title={clozeHint}>{content}</Tooltip> : content}
    </>
  )
}

const ENABLED_KEYS = [
  9, // tab
  16, // shift
  37, // left
  39, // right
  27, // escape
]
const ENABLED_CTRL_KEYS = [
  ...ENABLED_KEYS,
  67, // c
  65, // a
]
const isEnabledKey = (keyCode: number, ctrlKey: boolean) =>
  ctrlKey ? ENABLED_CTRL_KEYS.includes(keyCode) : ENABLED_KEYS.includes(keyCode)

export default FlashcardDisplayField

function ClozeUnderlay({
  deletions,
  clozeId,
  previewClozeIndex,
  value,
  viewMode,
  editing,
}: {
  deletions: ClozeDeletion[]
  clozeId: string
  previewClozeIndex: number | undefined
  value: string
  viewMode: ViewMode
  editing: boolean
}) {
  return (
    <>
      {deletions
        // .filter(d => d.clozeId === clozeId)
        .map(({ ranges }, clozeIndex) => {
          const id = ClozeIds[clozeIndex]
          if (
            typeof previewClozeIndex === 'number' &&
            previewClozeIndex !== -1 &&
            clozeIndex !== previewClozeIndex
          )
            return null
          return (
            <span
              className={cn(css.clozeUnderlay, id, {
                [css.currentClozeUnderlay]: id === clozeId,
                [css.previewBlank]: clozeIndex === previewClozeIndex,
              })}
              contentEditable={editing}
              suppressContentEditableWarning
              tabIndex={-1}
            >
              {ranges.reduce(
                (elements, { start, end }, i) => {
                  // const lastEnd  ranges[i - 1].end
                  if (i === 0 && start > 0)
                    elements.push(
                      clearNewlines(value.slice(0, start), viewMode)
                    ) // + 1?
                  elements.push(
                    <span
                      className={cn(css.clozeUnderlayDeletion, {
                        [css.currentClozeUnderlayDeletion]: id === clozeId,
                      })}
                    >
                      {clearNewlines(value.slice(start, end), viewMode)}
                    </span>
                  )
                  const nextStart = ranges[i + 1]
                    ? ranges[i + 1].start
                    : value.length // + 1?
                  if (nextStart - end > 0)
                    elements.push(
                      clearNewlines(value.slice(end, nextStart), viewMode)
                    ) // + 1?
                  return elements
                },
                [] as ReactNode[]
              )}
            </span>
          )
        })}
    </>
  )
}
