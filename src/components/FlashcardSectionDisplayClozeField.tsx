import React, {
  useCallback,
  ReactNodeArray,
  useEffect,
  ReactNode,
  useMemo,
  useState,
  KeyboardEventHandler,
} from 'react'
import os from 'os'
import cn from 'classnames'
import css from './FlashcardSectionDisplay.module.css'
import FieldMenu from './FlashcardSectionFieldPopoverMenu'
import { Tooltip } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import {
  getSelectionWithin,
  ClozeControls,
  setSelectionRange,
} from '../utils/useClozeUi'
import * as r from '../redux'
import { KeyId, KEYS } from '../utils/keyboard'

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
  const [cursorPosition, setCursorPosition] = useState<number | null>(null)
  useEffect(
    () => {
      const onlyShowCursorWhenNoSelectionInClozeField = () => {
        if (ref.current) {
          if (document.activeElement !== ref.current)
            return setCursorPosition(null)

          const currentClozeSelection = getSelectionWithin(ref.current)

          const clozeSelectionCurrentlyMade =
            currentClozeSelection.end - currentClozeSelection.start !== 0
          const newPosition = clozeSelectionCurrentlyMade
            ? null
            : currentClozeSelection.end
          setCursorPosition(newPosition)
        }
      }
      document.addEventListener(
        'selectionchange',
        onlyShowCursorWhenNoSelectionInClozeField
      )
      return () =>
        document.removeEventListener(
          'selectionchange',
          onlyShowCursorWhenNoSelectionInClozeField
        )
    },
    [ref]
  )

  const rangesWithClozeIndexes = deletions
    .flatMap(({ ranges }, clozeIndex) => {
      return ranges.map(range => ({ range, clozeIndex }))
    })
    .sort((a, b) => a.range.start - b.range.start)
  const segments: ReactNode[] = useMemo(
    () => {
      const newlineChar = viewMode === 'HORIZONTAL' ? '⏎' : '\n'
      const segments: ReactNode[] = []

      const first = rangesWithClozeIndexes[0]
      if (!first || first.range.start > 0) {
        const startPaddingEnd = first ? first.range.start : value.length
        segments.push(
          ...[...value.slice(0, startPaddingEnd)].map((c, i) =>
            charSpan(
              c,
              i,
              css.clozeValueChar,
              0, // ?
              newlineChar,
              cursorPosition === i
            )
          )
        )
      }

      rangesWithClozeIndexes.forEach(
        ({ range: { start, end }, clozeIndex }, i) => {
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
                newlineChar,
                cursorPosition === start + i
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
                  newlineChar,
                  cursorPosition === end + i
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
      cursorPosition,
    ]
  )

  const dispatch = useDispatch()

  const onKeyDown: KeyboardEventHandler<HTMLSpanElement> = useCallback(
    e => {
      if (!isEnabledKey(e)) return e.preventDefault()
      switch (e.key) {
        case KEYS.arrowLeft: {
          const selection = getSelectionWithin(e.target as HTMLInputElement)
          const selectionMade = selection.end - selection.start !== 0
          if (selectionMade) {
            if (e.shiftKey) {
              break
            } else {
              setSelectionRange(
                e.target as HTMLSpanElement,
                selection.start,
                selection.start
              )

              setCursorPosition(selection.start)
              break
            }
          } else {
            if (e.shiftKey) {
              const start = cursorPosition == null ? 0 : cursorPosition - 1
              const end = cursorPosition == null ? 0 : cursorPosition

              setSelectionRange(e.target as HTMLSpanElement, start, end)
              e.preventDefault()
            } else
              setCursorPosition(cursorPosition =>
                cursorPosition == null
                  ? cursorPosition
                  : Math.max(cursorPosition - 1, 0)
              )
          }
          break
        }
        case KEYS.arrowRight: {
          const selection = getSelectionWithin(e.target as HTMLSpanElement)
          const selectionMade = selection.end - selection.start !== 0
          if (selectionMade) {
            if (e.shiftKey) {
              break
            } else {
              setSelectionRange(
                e.target as HTMLSpanElement,
                selection.end,
                selection.end
              )
              setCursorPosition(selection.end)
              e.preventDefault()
              break
            }
          } else {
            if (e.shiftKey) {
              const start = cursorPosition == null ? 0 : cursorPosition
              const end = cursorPosition == null ? 0 : cursorPosition + 1

              console.log({ start, end })
              ref.current && setSelectionRange(ref.current, start, end)
              e.preventDefault()
            } else {
              setCursorPosition(cursorPosition =>
                cursorPosition == null
                  ? cursorPosition
                  : Math.min(cursorPosition + 1, value.length)
              )
            }
          }
          break
        }

        case KEYS.delete: {
          const selection = getSelectionWithin(e.target as HTMLInputElement)
          onPressDelete(selection)
          e.preventDefault()
          break
        }
        case KEYS.backspace: {
          const selection = getSelectionWithin(e.target as HTMLInputElement)
          onBackspace(selection)
          e.preventDefault()
          break
        }
        case KEYS.escape:
          ;(e.target as HTMLSpanElement).blur()
          break
        case KEYS.eLowercase:
        case KEYS.eUppercase:
          dispatch(r.startEditingCards())
          e.preventDefault()
          break
        default:
      }
    },
    [onBackspace, onPressDelete, dispatch, value, cursorPosition]
  )

  const [wasLoopingBeforeFocus, setWasLoopingBeforeFocus] = useState(false)
  const handleFocus = useCallback(
    e => {
      if (ref.current) {
        const selection = getSelectionWithin(ref.current)
        const currentlySelected = selection.end - selection.start !== 0
        if (!currentlySelected) setCursorPosition(0)
      }
      if (!editing && isMediaPlaying) {
        setWasLoopingBeforeFocus(loopIsOn)
        dispatch(r.setLoop(true))
      }
    },
    [loopIsOn, setWasLoopingBeforeFocus, isMediaPlaying, editing, dispatch]
  )
  const handleBlur = useCallback(
    e => {
      setCursorPosition(null)
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
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      ref={ref}
    >
      {segments}
      {cursorPosition === value.length && <span className={css.clozeCursor} />}
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

type SelectState = {
  position: number
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
  newlineChar: string,
  hasCursor?: boolean
) => {
  const isNewline = char === '\n' || char === '\r'
  const content = isNewline ? newlineChar : char
  return (
    <span
      className={cn(className, {
        [css.clozeNewlinePlaceholder]: isNewline,
        [css.clozeCursor]: hasCursor,
      })}
      key={String(index + char)}
      style={{
        ['--cloze-background-hue' as any]: ClozeHues[ClozeIds[clozeIndex]],
      }}
    >
      {content}
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
  <div>
    Select the text you wish to blank out.
    <br />
    <br />
    Hit Backspace to trim selection.
    <br />
    <br />
    Hit Enter when finished.
  </div>
)

const ENABLED_KEYS = new Set<KeyId>([
  KEYS.tab,
  KEYS.shift,
  KEYS.arrowLeft,
  KEYS.arrowRight,
  KEYS.escape,
  KEYS.eLowercase,
  KEYS.eUppercase,
  KEYS.delete,
  KEYS.backspace,
  KEYS.backspace,
])
const ENABLED_META_CTRL_KEYS = new Set<KeyId>([
  ...ENABLED_KEYS,
  KEYS.cLowercase,
  KEYS.cUppercase,
  KEYS.aLowercase,
  KEYS.aUppercase,
])
export const getMetaOrCtrlKey =
  os.platform() === 'darwin'
    ? (e: KeyboardEvent | React.KeyboardEvent<Element>) => e.metaKey
    : (e: KeyboardEvent | React.KeyboardEvent<Element>) => e.ctrlKey
const isEnabledKey = (e: KeyboardEvent | React.KeyboardEvent<Element>) => {
  const { key } = e
  const metaOrCtrlKey = getMetaOrCtrlKey(e)
  return metaOrCtrlKey
    ? ENABLED_META_CTRL_KEYS.has(key as KeyId)
    : ENABLED_KEYS.has(key as KeyId)
}

export default ClozeField
