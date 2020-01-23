import React, { useCallback, memo } from 'react'
import { useSelector } from 'react-redux'
import {
  Table,
  Toolbar,
  TableBody,
  Paper,
  Checkbox,
  IconButton,
} from '@material-ui/core'
import { ExpandLess, ExpandMore } from '@material-ui/icons'
import * as r from '../redux'
import css from './Export.module.css'
import cn from 'classnames'
import moment from 'moment'
import FlashcardRow from './ReviewAndExportMediaTableRow'
import { formatDuration } from '../utils/formatTime'

enum $ {
  container = 'review-and-export-media-table-container',
}

type MediaTableProps = {
  media: MediaFile
  open: boolean
  selectedIds: string[]
  onSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onClick: (index: number) => void
  mediaIndex: number
}

const ReviewAndExportMediaTable = memo(
  ({
    media,
    open,
    selectedIds,
    onSelect,
    onSelectAll,
    onClick,
    mediaIndex,
  }: MediaTableProps) => {
    const { clipsIds, highlightedClipId } = useSelector((state: AppState) => ({
      clipsIds: state.clips.idsByMediaFileId[media.id],
      highlightedClipId: r.getHighlightedClipId(state),
    }))
    const toggleOpen = useCallback(() => onClick(open ? -1 : mediaIndex), [
      onClick,
      open,
      mediaIndex,
    ])
    const stopPropagation = useCallback(e => e.stopPropagation, [])
    const selectAll = useCallback(() => onSelectAll(clipsIds), [
      onSelectAll,
      clipsIds,
    ])

    return !clipsIds.length ? null : (
      <Paper id={$.container}>
        <Toolbar
          className={cn(css.toolbar, { [css.openToolbar]: open })}
          onClick={toggleOpen}
        >
          <Checkbox
            checked={clipsIds.every(id => selectedIds.includes(id))}
            onChange={selectAll}
            onClick={stopPropagation}
            className={css.selectAllClipsCheckbox}
          />

          <div className={css.selectedClipsCount}>
            {clipsIds.filter(id => selectedIds.includes(id)).length || '--'} of{' '}
            {clipsIds.length}
          </div>

          <h2 className={css.mediaFileName}>
            {media.name}{' '}
            <small>
              {formatDuration(
                moment.duration({ seconds: media.durationSeconds })
              )}
            </small>
          </h2>

          <IconButton>{open ? <ExpandLess /> : <ExpandMore />}</IconButton>
        </Toolbar>

        <Table className={css.table}>
          <colgroup>
            <col width="1%" />
            <col width="15%" />
            <col width="70%" />
            <col width="10%" />
            <col width="10%" />
          </colgroup>
          {open && (
            <MediaTableBody
              {...{ clipsIds, onSelect, highlightedClipId, selectedIds }}
            />
          )}
        </Table>
      </Paper>
    )
  }
)

const MediaTableBody = React.memo(
  ({ clipsIds, onSelect, selectedIds }: MediaTableBodyProps) => {
    return (
      <TableBody>
        {clipsIds.map(id => (
          <FlashcardRow
            key={id}
            id={id}
            onSelect={onSelect}
            isSelected={selectedIds.includes(id)}
          />
        ))}
      </TableBody>
    )
  }
)
type MediaTableBodyProps = {
  clipsIds: string[]
  onSelect: (id: string) => void
  highlightedClipId: string | null
  selectedIds: string[]
}

export default ReviewAndExportMediaTable

export { $ as reviewAndExportMediaTable$ }
