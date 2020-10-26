import React, {
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
  memo,
  useRef,
} from 'react'
import os from 'os'
import cn from 'classnames'
import css from './FlashcardSectionDisplay.module.css'
import FieldMenu from './FlashcardSectionFieldPopoverMenu'
import { Tooltip } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ClozeControls } from '../utils/clozeField/useClozeControls'
import * as r from '../redux'
import usePopover from '../utils/usePopover'
import { DictionaryPopover } from './DictionaryPopover'
import { useFieldPopoverDictionary } from '../utils/clozeField/useFieldPopoverDictionary'

// check nico 38:53 einverstanden? gives no result
// check tobira
const ClozeField = ({
  className,
  fieldName,
  subtitles,
  linkedTracks,
  mediaFileId,
  value,
  clozeControls,
}: {
  className?: string
  fieldName: FlashcardFieldName
  subtitles: MediaSubtitlesRelation[]
  linkedTracks: SubtitlesFlashcardFieldsLinks
  mediaFileId: MediaFileId
  value: string
  clozeControls: ClozeControls
}) => {
  const {
    clozeIndex: currentClozeIndex = -1,
    previewClozeIndex = -1,
    deletions,
    inputRef: clozeInputRef,
  } = clozeControls

  const currentClozeId = ClozeIds[currentClozeIndex]
  const selectionHue =
    ClozeHues[currentClozeId || ClozeIds[deletions.length]] || 200

  const popover = usePopover()

  const handleDoubleClick = useCallback(
    (e: any) => {
      if (!clozeInputRef.current) return // dispatch(r.)

      popover.open(e)
      setTimeout(() => clozeInputRef.current && clozeInputRef.current.blur(), 0)
    },
    [clozeInputRef, popover]
  )

  const handleMouseDown = useCallback(
    (e: any) => {
      if (popover.isOpen) {
        // don't focus when closing popover
        e.preventDefault()
      }
    },
    [popover.isOpen]
  )

  const editing = currentClozeIndex !== -1

  useEffect(
    () => {
      if (clozeInputRef.current && editing) {
        const selection = window.getSelection()
        if (selection) selection.empty()
        clozeInputRef.current.blur()
        clozeInputRef.current.focus()
      }
    },
    [currentClozeIndex, clozeInputRef, editing]
  )
  const clozeId = ClozeIds[currentClozeIndex]
  const { viewMode, activeDictionaryType } = useSelector((state: AppState) => ({
    viewMode: state.settings.viewMode,
    activeDictionaryType: r.getActiveDictionaryType(state),
  }))

  const {
    cursorPosition,
    translationsAtCharacter,
    onKeyDown: handleKeyDown,
    handleFocus,
    handleBlur,
  } = useFieldPopoverDictionary(
    popover,
    activeDictionaryType,
    clozeControls,
    value,
    editing
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
          ...[...value.slice(0, startPaddingEnd)].map((c, i) => (
            <CharSpan
              key={`${c}${i}`}
              {...{
                char: c,
                index: i,
                className: css.clozeValueChar,
                clozeIndex: 0,
                newlineChar,
                hasCursor: cursorPosition === i,
              }}
            />
          ))
        )
      }

      rangesWithClozeIndexes.forEach(
        ({ range: { start, end }, clozeIndex }, i) => {
          segments.push(
            ...[...value.slice(start, end)].map((c, i) => (
              <CharSpan
                key={`${c}${start + i}`}
                {...{
                  char: c,
                  index: start + i,
                  className: cn(css.blank, {
                    [css.previewBlank]:
                      previewClozeIndex !== -1 &&
                      previewClozeIndex === clozeIndex,
                    [css.blankEditing]: clozeIndex === currentClozeIndex,
                  }),
                  clozeIndex,
                  newlineChar,
                  hasCursor: cursorPosition === start + i,
                }}
              />
            ))
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
              ...[...value.slice(end, subsequentGapEnd)].map((c, i) => (
                <CharSpan
                  key={`${c}${end + i}`}
                  {...{
                    char: c,
                    index: end + i,
                    className: css.clozeValueChar,
                    clozeIndex,
                    newlineChar,
                    hasCursor: cursorPosition === end + i,
                  }}
                />
              ))
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

  if (!value)
    return <span className={css.emptyFieldPlaceholder}>{fieldName}</span>

  const tooltipProps = editing
    ? {
        title: clozeHint,
      }
    : {
        title:
          deletions.length >= ClozeIds.length
            ? "You've reached the maximum number of cloze deletions for this card."
            : 'Select text and press C key to create a new cloze deletion card (a.k.a. fill-in-the blank).',
        placement: 'top' as const,
      }

  return (
    <div
      className={cn(css.previewField, className, {
        [css.previewFieldWithPopover]: Boolean(subtitles.length),
      })}
      style={{
        ['--cloze-selection-hue' as any]: selectionHue,
      }}
    >
      {Boolean(subtitles.length) && (
        <FieldMenu
          className={css.previewFieldMenuButton}
          linkedSubtitlesTrack={linkedTracks[fieldName]}
          mediaFileId={mediaFileId}
          fieldName={fieldName as TransliterationFlashcardFieldName}
        />
      )}
      <Tooltip
        key={value}
        {...tooltipProps}
        title={popover.isOpen && activeDictionaryType ? '' : tooltipProps.title}
      >
        <span
          className={cn(css.clozeFieldValue, clozeId, {
            [css.clozePreviewFieldValue]: previewClozeIndex !== -1,
          })}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          ref={clozeInputRef}
        >
          {segments}
          {cursorPosition === value.length && (
            <span className={css.clozeCursor} />
          )}
          {popover.isOpen && (
            <DictionaryPopover
              activeDictionaryType={activeDictionaryType}
              popover={popover}
              translationsAtCharacter={translationsAtCharacter}
            />
          )}
        </span>
      </Tooltip>
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

const CharSpan = memo(
  ({
    char,
    index,
    className,
    clozeIndex,
    newlineChar,
    hasCursor,
  }: {
    char: string
    index: number
    className: string
    clozeIndex: number
    newlineChar: string
    hasCursor?: boolean
  }) => {
    const isNewline = char === '\n' || char === '\r'
    const content = isNewline ? newlineChar : char
    const ref = useRef<HTMLSpanElement>(null)

    return (
      <span
        ref={ref}
        data-character-index={index}
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
)

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

export const getMetaOrCtrlKey =
  os.platform() === 'darwin'
    ? (e: KeyboardEvent | React.KeyboardEvent<Element>) => e.metaKey
    : (e: KeyboardEvent | React.KeyboardEvent<Element>) => e.ctrlKey

export default ClozeField
