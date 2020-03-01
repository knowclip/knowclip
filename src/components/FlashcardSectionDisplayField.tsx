import React, {
  useCallback,
  ReactNodeArray,
  useRef,
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
  // confirmSelection?: (e: any) => void
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
      children &&
      fieldValueRef ? (
        <div className={css.clozeField}>
          {clozeDeletions && (
            <ClozeUnderlay
              deletions={clozeDeletions}
              clozeId={ClozeIds[clozeIndex]}
              previewClozeIndex={previewClozeIndex}
              value={children}
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
          {clozeDeletions && children && (
            <ClozeUnderlay
              deletions={clozeDeletions}
              clozeId={ClozeIds[clozeIndex]}
              previewClozeIndex={previewClozeIndex}
              value={children}
            />
          )}
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
  // const divRef = useRef<HTMLDivElement | null>(null)

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
    <span
      ref={fieldValueRef}
      // contentEditable
      // tabIndex={-1}
      // onFocus={blur}
      // onKeyDown={preventDefault}
      className={css.fieldValue}
    >
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
  clozeTextInputActions: { onSelect, onBackspace, onPressDelete, onEnter },
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
    [clozeIndex, ref.current]
  )

  const clozeId = ClozeIds[clozeIndex]
  const withoutNewlines = clearNewlines(value, clozeId)
  // const horizontal =
  //   useSelector((state: AppState) => state.settings.viewMode) === 'HORIZONTAL'

  const onCopy = useCallback(e => {
    const selection = window.getSelection()
    if (!selection) return
    var text = selection.toString().replace(/⏎/g, '\n')
    e.clipboardData.setData('text/plain', text)
    e.preventDefault()
  }, [])

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
        default:
      }
    },
    // [confirmSelection]
    [onBackspace, ref]
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

  const handleMouseUp = useCallback(e => {
    console.log({ MOUSEUP: e })
  }, [])

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

  return (
    <>
      {subtitlesMenu}
      <Tooltip title={clozeHint}>
        <span
          contentEditable
          suppressContentEditableWarning
          className={cn(css.clozeFieldValue, clozeId)}
          onKeyDown={onKeyDown}
          onPaste={preventDefault}
          onCut={preventDefault}
          onDragEnd={preventDefault}
          onDragExit={preventDefault}
          onDragOver={preventDefault}
          onSelect={handleSelect}
          onKeyUp={handleKeyUp}
          onMouseUp={handleMouseUp}
          // style={{ caretColor: ClozeColors[ClozeIds[clozeIndex]] }}
          onCopy={onCopy}
          ref={ref}
        >
          {withoutNewlines}
        </span>
      </Tooltip>
    </>
  )
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

function ClozeUnderlay({
  deletions,
  clozeId,
  previewClozeIndex,
  value,
}: {
  deletions: ClozeDeletion[]
  clozeId: string
  previewClozeIndex: number | undefined
  value: string
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
              contentEditable
              suppressContentEditableWarning
            >
              {ranges.reduce(
                (elements, { start, end }, i) => {
                  // const lastEnd  ranges[i - 1].end
                  if (i === 0 && start > 0)
                    elements.push(clearNewlines(value.slice(0, start))) // + 1?
                  elements.push(
                    <span
                      className={cn(css.clozeUnderlayDeletion, {
                        [css.currentClozeUnderlayDeletion]: id === clozeId,
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
    </>
  )
}
