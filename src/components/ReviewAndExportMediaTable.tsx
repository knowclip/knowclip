import React, { useCallback, memo, EventHandler } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Toolbar, Paper, Checkbox, IconButton, Tooltip } from '@mui/material'
import { ExpandLess, ExpandMore, FolderSpecial } from '@mui/icons-material'
import r from '../redux'
import css from './Export.module.css'
import cn from 'classnames'
import moment from 'moment'
import FlashcardRow from './ReviewAndExportMediaTableRow'
import { formatDuration } from '../utils/formatTime'
import {
  AutoSizer as AutoSizer_,
  CellMeasurerCache,
  List as List_,
  ListRowRenderer,
  CellMeasurer as CellMeasurer_,
} from 'react-virtualized'
import { reviewAndExportMediaTable$ as $ } from './ReviewAndExportMediaTable.testLabels'

const AutoSizer = AutoSizer_ as any
const List = List_ as any
const CellMeasurer = CellMeasurer_ as any

type MediaTableProps = {
  media: MediaFile
  open: boolean
  selectedIds: Array<string | undefined>
  onSelectRow: (mediaFileId: string, id: string) => void
  onDoubleClickRow: (mediaFileId: string, id: string) => void
  onSelectAll: (mediaFileId: string) => void
  onClick: (index: number) => void
  mediaIndex: number
}

const cache = new CellMeasurerCache({
  fixedWidth: true,
  minHeight: 25,
  defaultHeight: 120,
})

const ReviewAndExportMediaTable = memo(function ReviewAndExportMediaTable({
  media,
  open,
  selectedIds,
  onSelectRow,
  onDoubleClickRow,
  onSelectAll,
  onClick,
  mediaIndex,
}: MediaTableProps) {
  const { clipsIds, highlightedClipId, availability } = useSelector(
    (state: AppState) => ({
      clipsIds: state.clips.idsByMediaFileId[media.id],
      highlightedClipId: r.getHighlightedClipId(state),
      availability: r.getFileAvailability(state, media),
    })
  )

  const fileRemembered = Boolean(
    availability.status === 'CURRENTLY_LOADED' ||
      availability.status === 'PREVIOUSLY_LOADED'
  )
  const dispatch = useDispatch()
  const toggleOpen = useCallback(() => {
    onClick(open ? -1 : mediaIndex)
    if (!open)
      dispatch(fileRemembered ? r.openFileRequest(media) : r.dismissMedia())
  }, [onClick, open, mediaIndex, dispatch, fileRemembered, media])
  const stopPropagation: EventHandler<any> = useCallback(
    (e) => e.stopPropagation(),
    []
  )
  const selectAll = useCallback(
    () => onSelectAll(media.id),
    [onSelectAll, media.id]
  )

  const handleSelectRow = useCallback(
    (id: string) => onSelectRow(media.id, id),
    [media.id, onSelectRow]
  )
  const handleDoubleClickRow = useCallback(
    (id: string) => onDoubleClickRow(media.id, id),
    [media.id, onDoubleClickRow]
  )

  const rowRenderer: ListRowRenderer = useCallback(
    ({ index, key, parent, style }) => {
      const id = clipsIds[index]

      return (
        <CellMeasurer
          cache={cache}
          columnIndex={0}
          key={key}
          parent={parent}
          rowIndex={index}
        >
          {({ measure, registerChild }: any) => (
            <FlashcardRow
              key={key}
              id={id}
              onSelect={handleSelectRow}
              highlightClip={handleDoubleClickRow}
              isSelected={selectedIds.includes(id)}
              isHighlighted={highlightedClipId === id}
              style={style}
              measure={measure}
              registerChild={registerChild}
            />
          )}
        </CellMeasurer>
      )
    },
    [
      clipsIds,
      handleDoubleClickRow,
      handleSelectRow,
      highlightedClipId,
      selectedIds,
    ]
  )

  return (
    <Paper className={$.container}>
      <Toolbar
        className={cn(css.toolbar, { [css.openToolbar]: open }, $.header)}
        onClick={toggleOpen}
      >
        <Checkbox
          checked={
            Boolean(clipsIds.length) &&
            clipsIds.every((id, i) => selectedIds[i] === id)
          }
          onChange={selectAll}
          onClick={stopPropagation}
          className={cn(css.selectAllClipsCheckbox, $.checkbox)}
        />

        <div className={css.selectedClipsCount}>
          {clipsIds.filter((id, i) => selectedIds[i] === id).length || '--'} of{' '}
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

      <div>
        {open && (
          <AutoSizer disableHeight>
            {({ width }: any) => (
              <List
                className={css.table}
                height={clipsIds.length ? 450 : 80}
                width={width}
                padding={10}
                rowHeight={cache.rowHeight}
                rowCount={clipsIds.length}
                rowRenderer={rowRenderer}
                noRowsRenderer={noRowsRenderer}
              />
            )}
          </AutoSizer>
        )}
      </div>
    </Paper>
  )
})

const noRowsRenderer = () => (
  <p style={{ padding: '0 2em', textAlign: 'center' }}>
    No clips have been made for this media file.
  </p>
)

export default ReviewAndExportMediaTable
