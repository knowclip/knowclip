import React, { useCallback, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  TableRow,
  TableCell,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
} from '@material-ui/core'
import { Loop } from '@material-ui/icons'
import * as r from '../redux'
import css from './Export.module.css'
import cn from 'classnames'
import truncate from '../utils/truncate'
import * as actions from '../actions'

enum $ {
  clipCheckboxes = 'review-and-export-table-row-clip-checkbox',
}

type FlashcardRowProps = {
  id: string
  onSelect: (id: string) => void
  isSelected: boolean
}
const ReviewAndExportMediaTableRow = memo(
  ({ id, isSelected, onSelect }: FlashcardRowProps) => {
    const {
      flashcard: { fields, tags },
      formattedClipTime,
      isLoopOn,
      highlightedClipId,
    } = useSelector((state: AppState) => ({
      flashcard: r.getFlashcard(state, id) as Flashcard,
      formattedClipTime: r.getFormattedClipTime(state, id),
      isLoopOn: r.isLoopOn(state),
      highlightedClipId: r.getHighlightedClipId(state),
    }))
    const isHighlighted = id === highlightedClipId

    const dispatch = useDispatch()
    const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
      dispatch,
    ])

    return (
      <TableRow
        className={css.tableRow}
        onClick={useCallback(() => dispatch(actions.highlightClip(id)), [
          dispatch,
          id,
        ])}
        selected={isHighlighted}
      >
        <TableCell padding="checkbox">
          <Checkbox
            checked={isSelected}
            onClick={useCallback(e => e.stopPropagation(), [])}
            onChange={useCallback(() => onSelect(id), [onSelect, id])}
            className={$.clipCheckboxes}
          />
        </TableCell>
        <TableCell padding="default">
          <span className={css.clipTime}>{formattedClipTime}</span>
          {isHighlighted && (
            <IconButton
              onClick={toggleLoop}
              color={isLoopOn ? 'secondary' : 'default'}
            >
              <Loop />
            </IconButton>
          )}
        </TableCell>
        <TableCell className={css.flashcardContents}>
          <p
            className={cn(css.transcription, {
              [css.blank]: !fields.transcription.trim(),
            })}
          >
            {fields.transcription.trim() || '[no transcription given]'}
          </p>
          {'pronunciation' in fields && (
            <p className={css.pronunciation}>{fields.pronunciation}</p>
          )}
          <p
            className={cn(css.meaning, { [css.blank]: !fields.meaning.trim() })}
          >
            {fields.meaning.trim() || '[no meaning given]'}
          </p>
        </TableCell>
        <TableCell>
          <p className={css.field}>{fields.notes}</p>
        </TableCell>
        <TableCell>
          {tags.map(t => (
            <ShortTag key={t} title={t} />
          ))}
        </TableCell>
      </TableRow>
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

export default ReviewAndExportMediaTableRow

export { $ as reviewAndExportMediaTableRow$ }
