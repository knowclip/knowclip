import React, { useCallback, memo, useEffect, ReactNode, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Checkbox, Chip, IconButton, Tooltip } from '@material-ui/core'
import { Loop } from '@material-ui/icons'
import * as r from '../redux'
import css from './Export.module.css'
import cn from 'classnames'
import truncate from '../utils/truncate'
import * as actions from '../actions'
import { ListRowProps } from 'react-virtualized'
import { CellMeasurerChildProps } from 'react-virtualized/dist/es/CellMeasurer'

enum $ {
  container = 'review-and-export-table-row-container',
  clipCheckboxes = 'review-and-export-table-row-clip-checkbox',
  highlightedClipRow = 'review-and-export-table-highlighted-clip-row',
}

type FlashcardRowProps = {
  id: string
  onSelect: (id: string) => void
  isSelected: boolean
  isHighlighted: boolean
  style: ListRowProps['style']
  measure: CellMeasurerChildProps['measure']
  registerChild: CellMeasurerChildProps['registerChild']
}

const ReviewAndExportMediaTableRow = memo(
  ({
    id,
    isSelected,
    onSelect,
    isHighlighted,
    style,
    measure,
    registerChild,
  }: FlashcardRowProps) => {
    const {
      flashcard: { fields, tags, cloze },
      formattedClipTime,
      clipTime,
      isLoopOn,
      currentMediaFile,
    } = useSelector((state: AppState) => ({
      flashcard: r.getFlashcard(state, id) as Flashcard,
      clipTime: r.getClipTime(state, id),
      formattedClipTime: r.getFormattedClipTime(state, id),
      isLoopOn: r.isLoopOn(state),
      currentMediaFile: r.getCurrentMediaFile(state),
    }))

    const dispatch = useDispatch()
    const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
      dispatch,
    ])

    useEffect(() => measure(), [measure])

    return (
      <section
        ref={registerChild as any}
        style={style}
        className={cn(css.tableRow, $.container, {
          [$.highlightedClipRow]: isHighlighted,
          [css.highlightedClipRow]: isHighlighted,
        })}
        onDoubleClick={useCallback(
          () => {
            if (currentMediaFile && !isHighlighted && clipTime) {
              const mediaPlayer = document.getElementById(
                'mediaPlayer'
              ) as HTMLVideoElement | null
              if (mediaPlayer) mediaPlayer.currentTime = clipTime.start
            }
          },
          [clipTime, currentMediaFile, isHighlighted]
        )}
      >
        <section className={css.checkbox}>
          <Checkbox
            checked={isSelected}
            onClick={useCallback(e => e.stopPropagation(), [])}
            onChange={useCallback(() => onSelect(id), [onSelect, id])}
            className={$.clipCheckboxes}
          />
        </section>
        <section className={css.clipTime}>
          <span className={css.clipTimeText}>{formattedClipTime}</span>
          {isHighlighted && (
            <IconButton
              onClick={toggleLoop}
              color={isLoopOn ? 'secondary' : 'default'}
            >
              <Loop />
            </IconButton>
          )}
        </section>
        <section className={css.flashcardContents}>
          <p
            className={cn(css.transcription, {
              [css.blank]: !fields.transcription.trim(),
            })}
          >
            <TranscriptionFieldPreview
              value={fields.transcription.trim()}
              clozeDeletions={cloze}
            />
          </p>
          {'pronunciation' in fields && (
            <p className={css.pronunciation}>{fields.pronunciation}</p>
          )}
          <p
            className={cn(css.meaning, { [css.blank]: !fields.meaning.trim() })}
          >
            {fields.meaning.trim() || '[no meaning given]'}
          </p>
          {fields.notes.trim() && (
            <p className={cn(css.field, css.notes)}>{fields.notes}</p>
          )}
        </section>
        <section className={css.tags}>
          {tags.map(t => (
            <ShortTag key={t} title={t} />
          ))}
        </section>
      </section>
    )
  }
)

const ShortTag = ({ title }: { title: string }) =>
  title.length > 12 ? (
    <Tooltip title={title}>
      <Chip label={truncate(title, 12)} />
    </Tooltip>
  ) : (
    <Chip label={title} />
  )

const TranscriptionFieldPreview = ({
  value,
  clozeDeletions,
}: {
  value: string
  clozeDeletions: ClozeDeletion[]
}) => {
  const rangesWithClozeIndexes = clozeDeletions
    .flatMap(({ ranges }, clozeIndex) => {
      return ranges.map(range => ({ range, clozeIndex }))
    })
    .sort((a, b) => a.range.start - b.range.start)
  const segments: ReactNode[] = useMemo(
    () => {
      const segments: ReactNode[] = []
      rangesWithClozeIndexes.forEach(
        ({ range: { start, end }, clozeIndex }, i) => {
          if (i === 0 && start > 0) {
            segments.push(value.slice(0, start))
          }
          segments.push(
            <span
              className={css.clozeDeletion}
              key={String(start) + String(end)}
            >
              {value.slice(start, end)}
            </span>
          )

          const nextRange: {
            range: ClozeRange
            clozeIndex: number
          } | null = rangesWithClozeIndexes[i + 1] || null
          const subsequentGapEnd = nextRange
            ? nextRange.range.start
            : value.length

          if (subsequentGapEnd - end > 0) {
            segments.push(value.slice(end, subsequentGapEnd))
          }
        }
      )
      return segments
    },
    [rangesWithClozeIndexes, value]
  )

  if (!value) return <>[no transcription given]</>
  return <>{segments}</>
}

export default ReviewAndExportMediaTableRow

export { $ as reviewAndExportMediaTableRow$ }
