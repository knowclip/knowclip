import React, { useState, useCallback, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Dialog,
  DialogActions,
  DialogContent,
  Table,
  Toolbar,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Paper,
  Tabs,
  Tab,
  Checkbox,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
} from '@material-ui/core'
import { ExpandLess, ExpandMore, Loop } from '@material-ui/icons'
import * as r from '../redux'
import css from './Export.module.css'
import cn from 'classnames'
import moment from 'moment'
import { showSaveDialog } from '../utils/electron'
import truncate from '../utils/truncate'
import * as actions from '../actions'
import { DialogProps } from './DialogProps'

const ShortTag = ({ title }: { title: string }) =>
  title.length > 12 ? (
    <Tooltip title={title}>
      <Chip label={truncate(title, 12)} />
    </Tooltip>
  ) : (
    <Chip label={title} />
  )

const SmallTag = ({ title }: { title: string }) =>
  title.length > 12 ? (
    <Tooltip title={title}>
      <span className={css.smallTag}>{truncate(title, 12)}</span>
    </Tooltip>
  ) : (
    <span className={css.smallTag}>{title}</span>
  )

type FlashcardRowProps = {
  id: string
  onSelect: (id: string) => void
  isSelected: boolean
}
const FlashcardRow = memo(({ id, isSelected, onSelect }: FlashcardRowProps) => {
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
  const toggleLoop = useCallback(e => dispatch(actions.toggleLoop()), [
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
          onChange={useCallback(e => onSelect(id), [onSelect, id])}
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
        <p className={cn(css.meaning, { [css.blank]: !fields.meaning.trim() })}>
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
})

const formatDuration = (duration: moment.Duration) =>
  [
    duration.hours(),
    duration
      .minutes()
      .toString()
      .padStart(2, '0'),
    duration
      .seconds()
      .toString()
      .padStart(2, '0'),
  ]
    .filter(v => v)
    .join(':')

type MediaTableProps = {
  media: MediaFile
  open: boolean
  selectedIds: string[]
  onSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onClick: (index: number) => void
  mediaIndex: number
}

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

const MediaTable = memo(
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
    const toggleOpen = useCallback(e => onClick(open ? -1 : mediaIndex), [
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
      <Paper>
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

const Export = ({ open }: DialogProps<ReviewAndExportDialogData>) => {
  const dispatch = useDispatch()
  const closeDialog = useCallback(e => dispatch(actions.closeDialog()), [
    dispatch,
  ])

  const {
    currentMedia,
    clipsIds,
    currentFileId,
    projectMedia,
    progress,
  } = useSelector((state: AppState) => {
    const currentMedia = r.getCurrentMediaFile(state)
    return {
      currentMedia,
      clipsIds: currentMedia
        ? state.clips.idsByMediaFileId[currentMedia.id]
        : [],
      currentFileId: r.getCurrentFileId(state),
      projectMedia: r.getCurrentProjectMediaFiles(state),
      progress: state.user.progress,
    }
  })

  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  const [selectionHasStarted, setSelectionHasStarted] = useState(false)
  const chooseTab = (index: number) => {
    setCurrentTabIndex(index)
    setSelectionHasStarted(false)
  }
  const startSelection = useCallback(() => setSelectionHasStarted(true), [
    setSelectionHasStarted,
  ])

  const [selectedIds, setSelectedIds] = useState(clipsIds)
  const exportApkg = useCallback(
    e =>
      showSaveDialog('Anki APKG file', ['apkg']).then(
        (path: string | null) =>
          path && dispatch(actions.exportApkgRequest(selectedIds, path))
      ),
    [dispatch, selectedIds]
  )
  const csvAndMp3ExportDialog = useCallback(
    e => dispatch(actions.csvAndMp3ExportDialog(selectedIds)),
    [dispatch, selectedIds]
  )
  const exportMarkdown = useCallback(
    e => dispatch(actions.exportMarkdown(selectedIds)),
    [dispatch, selectedIds]
  )

  const onSelect = useCallback(
    (id: string) =>
      setSelectedIds(selectedIds =>
        selectedIds.includes(id)
          ? selectedIds.filter(x => x !== id)
          : selectedIds.concat(id)
      ),
    [setSelectedIds]
  )
  const onSelectAll = useCallback(
    (ids: string[]) =>
      setSelectedIds(selectedIds =>
        ids.every(id => selectedIds.includes(id))
          ? selectedIds.filter(id => !ids.includes(id))
          : [...new Set([...selectedIds, ...ids])]
      ),
    [setSelectedIds]
  )
  const [expandedTableIndex, setExpandedTableIndex] = useState(() =>
    projectMedia.findIndex(metadata => metadata.id === currentFileId)
  )
  const onClickTable = useCallback(
    (index: number) => {
      const mediaMetadata = projectMedia[index]
      if (mediaMetadata && currentMedia && mediaMetadata.id !== currentMedia.id)
        dispatch(actions.openFileRequest(mediaMetadata))
      setExpandedTableIndex(index)
    },
    [dispatch, currentMedia, setExpandedTableIndex, projectMedia]
  )

  const dialogContent = (
    <DialogContent>
      {currentTabIndex === 0 && (
        <section className={css.introText}>
          <p>
            Export an Anki .apkg file. This format is best for{' '}
            <strong>starting a new deck.</strong>
          </p>
          <p>
            If you want to update some flashcards you've previously exported, or
            add some new cards to a previously exported deck, you probably want
            to export CSV and MP3s.
          </p>
        </section>
      )}
      {currentTabIndex === 1 && (
        <section className={css.introText}>
          <p>Export a Comma-Separated-Values file along with MP3s.</p>
          <p>
            This format is best for{' '}
            <strong>updating or adding to a deck</strong> which you've
            previously exported.
          </p>
        </section>
      )}

      {currentTabIndex === 2 && (
        <section className={css.introText}>
          <p>Export a Markdown file.</p>
          <p>
            This lets you <strong>review all your notes</strong> in a handy text
            format.
          </p>
        </section>
      )}
      {selectionHasStarted &&
        projectMedia.map((metadata, i) => (
          <MediaTable
            key={metadata.id}
            open={i === expandedTableIndex}
            mediaIndex={i}
            onClick={onClickTable}
            media={metadata}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onSelectAll={onSelectAll}
          />
        ))}
    </DialogContent>
  )

  return (
    <Dialog
      open={open}
      onClose={useCallback(() => dispatch(actions.closeDialog()), [dispatch])}
      fullScreen={selectionHasStarted}
    >
      <Tabs value={currentTabIndex} className={css.tabs}>
        <Tab label="Export APKG" onClick={() => chooseTab(0)} />
        <Tab label="Export CSV & MP3" onClick={() => chooseTab(1)} />
        <Tab label="Export MD" onClick={() => chooseTab(2)} />
      </Tabs>
      {progress ? (
        <DialogContent>
          <LinearProgress variant="determinate" value={progress.percentage} />
          <p className={css.progressMessage}>{progress.message}</p>
        </DialogContent>
      ) : (
        dialogContent
      )}

      {selectionHasStarted ? (
        <DialogActions>
          <Button onClick={closeDialog} disabled={Boolean(progress)}>
            Exit
          </Button>
          {currentTabIndex === 1 && (
            <Button
              variant="contained"
              color="primary"
              disabled={Boolean(progress)}
              onClick={csvAndMp3ExportDialog}
            >
              Export CSV and MP3 from selected clips
            </Button>
          )}
          {currentTabIndex === 2 && (
            <Button
              variant="contained"
              color="primary"
              disabled={Boolean(progress)}
              onClick={exportMarkdown}
            >
              Export Markdown from selected clips
            </Button>
          )}
          {currentTabIndex === 0 && (
            <Button
              variant="contained"
              color="primary"
              disabled={Boolean(progress)}
              onClick={exportApkg}
            >
              Export Anki Deck from selected clips
            </Button>
          )}
        </DialogActions>
      ) : (
        <DialogActions>
          <Button disabled={Boolean(progress)} onClick={closeDialog}>
            Exit
          </Button>
          <Button disabled={Boolean(progress)} onClick={startSelection}>
            Continue
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

export default Export

type MediaTableBodyProps = {
  clipsIds: string[]
  onSelect: (id: string) => void
  highlightedClipId: string | null
  selectedIds: string[]
}
