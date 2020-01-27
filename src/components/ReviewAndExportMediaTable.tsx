import React, { useCallback, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Table,
  Toolbar,
  TableBody,
  Paper,
  Checkbox,
  IconButton,
  Tooltip,
} from '@material-ui/core'
import { ExpandLess, ExpandMore, FolderSpecial } from '@material-ui/icons'
import * as r from '../redux'
import css from './Export.module.css'
import cn from 'classnames'
import moment from 'moment'
import FlashcardRow from './ReviewAndExportMediaTableRow'
import { formatDuration } from '../utils/formatTime'

enum $ {
  container = 'review-and-export-media-table-container',
  header = 'review-and-export-media-table-header',
  checkbox = 'review-and-export-media-table-checkbox',
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
    const { clipsIds, highlightedClipId, availability } = useSelector(
      (state: AppState) => ({
        clipsIds: state.clips.idsByMediaFileId[media.id],
        highlightedClipId: r.getHighlightedClipId(state),
        availability: r.getFileAvailability(state, media),
      })
    )

    const fileRemembered = Boolean(
      availability.status === 'CURRENTLY_LOADED' ||
        availability.status === 'REMEMBERED'
    )
    const dispatch = useDispatch()
    const toggleOpen = useCallback(
      () => {
        onClick(open ? -1 : mediaIndex)
        if (!open)
          dispatch(fileRemembered ? r.openFileRequest(media) : r.dismissMedia())
      },
      [onClick, open, mediaIndex, dispatch, fileRemembered, media]
    )
    const stopPropagation = useCallback(e => e.stopPropagation(), [])
    const selectAll = useCallback(() => onSelectAll(clipsIds), [
      onSelectAll,
      clipsIds,
    ])

    return (
      <Paper className={$.container}>
        <Toolbar
          className={cn(css.toolbar, { [css.openToolbar]: open }, $.header)}
          onClick={toggleOpen}
        >
          <Checkbox
            checked={clipsIds.every(id => selectedIds.includes(id))}
            onChange={selectAll}
            onClick={stopPropagation}
            className={cn(css.selectAllClipsCheckbox, $.checkbox)}
          />

          <div className={css.selectedClipsCount}>
            {clipsIds.filter(id => selectedIds.includes(id)).length || '--'} of{' '}
            {clipsIds.length}
          </div>

          <h2 className={css.mediaFileName}>
            {!fileRemembered && (
              <>
                {
                  <Tooltip title="Not found in filesystem">
                    <FolderSpecial
                      style={{ verticalAlign: 'middle' }}
                      color="error"
                    />
                  </Tooltip>
                }{' '}
              </>
            )}
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
  ({
    clipsIds,
    onSelect,
    selectedIds,
    highlightedClipId,
  }: MediaTableBodyProps) => {
    return (
      <TableBody className={css.tableBody}>
        {clipsIds.map(id => (
          <FlashcardRow
            key={id}
            id={id}
            onSelect={onSelect}
            isSelected={selectedIds.includes(id)}
            isHighlighted={highlightedClipId === id}
          />
        ))}
        {!clipsIds.length && (
          <p style={{ padding: '0 2em', textAlign: 'center' }}>
            No clips have been made for this media file.
          </p>
        )}
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
