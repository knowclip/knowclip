import React, { useCallback, memo, useEffect, ReactNode, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Checkbox, Chip, IconButton, Tooltip } from '@mui/material'
import { Loop, Edit } from '@mui/icons-material'
import r from '../redux'
import css from './Export.module.css'
import cn from 'classnames'
import truncate from '../utils/truncate'
import { actions } from '../actions'
import { ListRowProps } from 'react-virtualized'
import { CellMeasurerChildProps } from 'react-virtualized/dist/es/CellMeasurer'
import { ClipwaveCallbackEvent, getRegionEnd } from 'clipwave'
import { getMediaPlayer } from '../utils/media'
import { CLIPWAVE_ID } from '../utils/clipwave'

import { reviewAndExportMediaTableRow$ as $ } from './ReviewAndExportMediaTableRow.testLabels'

type FlashcardRowProps = {
  id: string
  onSelect: (id: string) => void
  highlightClip: (id: string) => void
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
    highlightClip,
    isHighlighted,
    style,
    measure,
    registerChild,
  }: FlashcardRowProps) => {
    const {
      flashcard: { fields, tags, cloze },
      formattedClipTime,
      isLoopOn,
    } = useSelector((state: AppState) => ({
      flashcard: r.getFlashcard(state, id) as Flashcard,
      formattedClipTime: r.getFormattedClipTime(state, id),
      isLoopOn: r.getLoopState(state),
    }))

    const dispatch = useDispatch()
    const toggleLoop = useCallback(
      () => dispatch(actions.toggleLoop('BUTTON')),
      [dispatch]
    )

    const handleDoubleClick = useCallback(() => {
      window.dispatchEvent(
        new ClipwaveCallbackEvent(
          CLIPWAVE_ID,
          ({ actions, state, getItem }) => {
            const item = getItem(id)
            const regionIndex = item
              ? state.regions.findIndex(
                  (r, i) =>
                    item.start >= r.start &&
                    getRegionEnd(state.regions, i) <= item.end
                )
              : -1
            const media = getMediaPlayer()
            if (item && regionIndex !== -1 && media) {
              actions.selectItemAndSeekTo(regionIndex, id, media, item.start)
            }

            if (!media) {
              dispatch(r.selectWaveformItem({ type: 'Clip', id }))
            }
          }
        )
      )
    }, [id, dispatch])

    const startEditing = useCallback(() => {
      highlightClip(id)
      dispatch(actions.startEditingCards())
      dispatch(actions.closeDialog())
    }, [dispatch, highlightClip, id])

    useEffect(() => measure(), [measure])

    return (
      <section
        ref={registerChild as any}
        style={style}
        className={cn(css.tableRow, $.container, {
          [$.highlightedClipRow]: isHighlighted,
          [css.highlightedClipRow]: isHighlighted,
        })}
        onDoubleClick={handleDoubleClick}
      >
        <section className={css.checkbox}>
          <Checkbox
            checked={isSelected}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onSelect(id)}
            className={$.clipCheckboxes}
          />
        </section>
        <section className={css.clipTimeInSeconds}>
          <span className={css.clipTimeText}>{formattedClipTime}</span>
          <IconButton className={css.editButton} onClick={startEditing}>
            <Edit />
          </IconButton>
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
          {tags.map((t) => (
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
      return ranges.map((range) => ({ range, clozeIndex }))
    })
    .sort((a, b) => a.range.start - b.range.start)
  const segments: ReactNode[] = useMemo(() => {
    const segments: ReactNode[] = []
    const clozeStart = rangesWithClozeIndexes[0]
      ? rangesWithClozeIndexes[0].range.start
      : value.length
    if (clozeStart > 0) {
      segments.push(value.slice(0, clozeStart))
    }

    rangesWithClozeIndexes.forEach(({ range: { start, end } }, i) => {
      segments.push(
        <span className={css.clozeDeletion} key={String(start) + String(end)}>
          {value.slice(start, end)}
        </span>
      )

      const nextRange: {
        range: ClozeRange
        clozeIndex: number
      } | null = rangesWithClozeIndexes[i + 1] || null
      const subsequentGapEnd = nextRange ? nextRange.range.start : value.length

      if (subsequentGapEnd - end > 0) {
        segments.push(value.slice(end, subsequentGapEnd))
      }
    })
    return segments
  }, [rangesWithClozeIndexes, value])

  if (!value) return <>[no transcription given]</>
  return <>{segments}</>
}

export default ReviewAndExportMediaTableRow
