import React, {
  useCallback,
  ReactNodeArray,
  useEffect,
  ReactNode,
  useMemo,
  useState,
} from 'react'
import cn from 'classnames'
import css from './FlashcardSectionDisplay.module.css'
import FieldMenu from './FlashcardSectionFieldPopoverMenu'
import { Tooltip } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { getSelectionWithin, ClozeControls } from '../utils/useClozeUi'
import * as r from '../redux'

const ClozeField = ({
  className,
  fieldName,
  subtitles,
  linkedTracks,
  mediaFileId,
  value,
  onDoubleClick,
  clozeControls: {
    clozeIndex: currentClozeIndex = -1,
    previewClozeIndex = -1,
    deletions,
    inputRef: ref,
    clozeTextInputActions: { onSelect, onBackspace, onPressDelete },
  },
}: {
  className?: string
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
  value: string
  onDoubleClick?: ((fieldName: FlashcardFieldName) => void)
  clozeControls: ClozeControls
}) => {
  const linkedSubtitlesTrack = linkedTracks[fieldName] || null
  const subtitlesMenu = Boolean(subtitles.length) && (
    <FieldMenu
      className={css.previewFieldMenuButton}
      linkedSubtitlesTrack={linkedSubtitlesTrack}
      mediaFileId={mediaFileId}
      fieldName={fieldName as TransliterationFlashcardFieldName}
    />
  )

  const currentClozeId = ClozeIds[currentClozeIndex]
  const selectionHue =
    ClozeHues[currentClozeId || ClozeIds[deletions.length]] || 200
  const handleDoubleClick = useCallback(
    () => {
      if (onDoubleClick) onDoubleClick(fieldName)
    },
    [fieldName, onDoubleClick]
  )
  const editing = currentClozeIndex !== -1

  useEffect(
    () => {
      if (ref.current && editing) {
        const selection = window.getSelection()
        if (selection) selection.empty()
        ref.current.blur()
        ref.current.focus()
      }
    },
    [currentClozeIndex, ref, editing]
  )
  const clozeId = ClozeIds[currentClozeIndex]
  const { isMediaPlaying, loopIsOn, viewMode } = useSelector(
    (state: AppState) => ({
      isMediaPlaying: r.isMediaPlaying(state),
      loopIsOn: r.isLoopOn(state),
      viewMode: state.settings.viewMode,
    })
  )

  const rangesWithClozeIndexes = deletions
    .flatMap(({ ranges }, clozeIndex) => {
      return ranges.map(range => ({ range, clozeIndex }))
    })
    .sort((a, b) => a.range.start - b.range.start)
  const segments: ReactNode[] = useMemo(
    () => {
      const newlineChar = viewMode === 'HORIZONTAL' ? '⏎' : '\n'
      const segments = rangesWithClozeIndexes.length
        ? []
        : clearNewlines(value, viewMode)
      rangesWithClozeIndexes.forEach(
        ({ range: { start, end }, clozeIndex }, i) => {
          if (i === 0 && start > 0) {
            segments.push(
              ...[...value.slice(0, start)].map((c, i) =>
                charSpan(c, i, css.clozeValueChar, clozeIndex, newlineChar)
              )
            )
          }
          segments.push(
            ...[...value.slice(start, end)].map((c, i) =>
              charSpan(
                c,
                start + i,
                cn(css.blank, {
                  [css.previewBlank]:
                    previewClozeIndex !== -1 &&
                    previewClozeIndex === clozeIndex,
                  [css.blankEditing]: clozeIndex === currentClozeIndex,
                }),
                clozeIndex,
                newlineChar
              )
            )
          )

          const nextRange: {
            range: ClozeRange
            clozeIndex: number
          } | null = rangesWithClozeIndexes[i + 1] || null
          const subsequentGapEnd = nextRange
            ? nextRange.range.start
            : value.length

          if (subsequentGapEnd - end > 0) {
            segments.push(
              ...[...value.slice(end, subsequentGapEnd)].map((c, i) =>
                charSpan(
                  c,
                  end + i,
                  css.clozeValueChar,
                  clozeIndex,
                  newlineChar
                )
              )
            )
          }
        }
      )
      return segments
    },
    [
      currentClozeIndex,
      previewClozeIndex,
      rangesWithClozeIndexes,
      value,
      viewMode,
    ]
  )
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
        // delete
        case 46: {
          if (ref.current) {
            const selection = getSelectionWithin(ref.current)
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
        // esc
        case 27:
          e.target.blur()
          break

        default:
      }
    },
    [onBackspace, onPressDelete, ref]
  )
  const preventDefault = useCallback(e => {
    e.preventDefault()
  }, [])

  const dispatch = useDispatch()
  const [wasLoopingBeforeFocus, setWasLoopingBeforeFocus] = useState(false)
  const handleFocus = useCallback(
    e => {
      if (!editing && isMediaPlaying) {
        setWasLoopingBeforeFocus(loopIsOn)
        dispatch(r.setLoop(true))
      }
    },
    [loopIsOn, setWasLoopingBeforeFocus, isMediaPlaying, editing, dispatch]
  )
  const handleBlur = useCallback(
    e => {
      if (!editing && wasLoopingBeforeFocus !== loopIsOn)
        dispatch(r.setLoop(wasLoopingBeforeFocus))
    },
    [loopIsOn, wasLoopingBeforeFocus, editing, dispatch]
  )

  const content = (
    <span
      className={cn(css.clozeFieldValue, clozeId, {
        [css.clozePreviewFieldValue]: previewClozeIndex !== -1,
      })}
      contentEditable={true}
      tabIndex={0}
      suppressContentEditableWarning
      onKeyDown={onKeyDown}
      onPaste={preventDefault}
      onCut={preventDefault}
      onDragEnd={preventDefault}
      onDragExit={preventDefault}
      onDragOver={preventDefault}
      onCopy={onCopy}
      onFocus={handleFocus}
      onBlur={handleBlur}
      ref={ref}
    >
      {segments}
    </span>
  )

  if (!value)
    return <span className={css.emptyFieldPlaceholder}>{fieldName}</span>

  return (
    <div
      className={cn(css.previewField, className, {
        [css.previewFieldWithPopover]: Boolean(subtitles.length),
      })}
      onDoubleClick={handleDoubleClick}
      style={{
        ['--cloze-selection-hue' as any]: selectionHue,
      }}
    >
      {subtitlesMenu}
      {editing ? (
        <Tooltip title={clozeHint} key={value}>
          {content}
        </Tooltip>
      ) : (
        <Tooltip
          title={
            deletions.length >= ClozeIds.length
              ? "You've reached the maximum number of cloze deletions for this card."
              : 'Select text and press C key to create a new cloze deletion card (a.k.a. fill-in-the blank).'
          }
          placement="top"
        >
          {content}
        </Tooltip>
      )}
    </div>
  )
}

export type ClozeId =
  | 'c1'
  | 'c2'
  | 'c3'
  | 'c4'
  | 'c5'
  | 'c6'
  | 'c7'
  | 'c8'
  | 'c9'
  | 'c10'
export const ClozeIds = [
  'c1',
  'c2',
  'c3',
  'c4',
  'c5',
  'c6',
  'c7',
  'c8',
  'c9',
  'c10',
] as const

export const ClozeHues = {
  c1: 240,
  c2: 130,
  c3: 60,
  c4: 180,
  c5: 300,
  c6: 41,
  c7: 78,
  c8: 0,
  c9: 215,
  c10: 271,
}

const charSpan = (
  char: string,
  index: number,
  className: string,
  clozeIndex: number,
  newlineChar: string
) => {
  const isNewline = char === '\n' || char === '\r'
  return (
    <span
      className={cn(className, { [css.clozeNewlinePlaceholder]: isNewline })}
      key={String(index + char)}
      style={{
        ['--cloze-background-hue' as any]: ClozeHues[ClozeIds[clozeIndex]],
      }}
    >
      {isNewline ? newlineChar : char}
    </span>
  )
}

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

export default ClozeField
