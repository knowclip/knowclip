import React, { useState } from 'react'
import { connect } from 'react-redux'
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
} from '@material-ui/core'
import { ExpandLess, ExpandMore, Loop } from '@material-ui/icons'
import * as r from '../redux'
import css from './Export.module.css'
import cn from 'classnames'
import moment from 'moment'

let FlashcardRow = ({
  flashcard: { fields, id, tags },
  highlightClip,
  closeModal,
  file,
  isSelected,
  isHighlighted,
  formattedClipTime,
  onSelect,
  toggleLoop,
  isLoopOn,
}) => (
  <TableRow
    className={css.tableRow}
    onClick={() => highlightClip(id)}
    onDoubleClick={closeModal}
    selected={isHighlighted}
  >
    <TableCell padding="checkbox">
      <Checkbox
        checked={isSelected}
        onClick={e => e.stopPropagation()}
        onChange={e => onSelect(id)}
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
      {fields.pronunciation && (
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
        <Chip key={t} label={t} />
      ))}
    </TableCell>
  </TableRow>
)
FlashcardRow = connect(
  (state, { id }) => ({
    formattedClipTime: r.getFormattedClipTime(state, id),
    isLoopOn: r.isLoopOn(state),
  }),
  { highlightClip: r.highlightClip, toggleLoop: r.toggleLoop }
)(FlashcardRow)

const formatDuration = duration =>
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
let MediaTable = ({
  media,
  clips,
  open,
  closeDialog,
  selectedIds,
  onSelect,
  onSelectAll,
  toggleOpen,
  highlightedClipId,
}) =>
  !clips.length ? null : (
    <Paper>
      <Toolbar
        className={cn(css.toolbar, { [css.openToolbar]: open })}
        onClick={toggleOpen}
      >
        <Checkbox
          checked={clips.every(c => selectedIds.includes(c.id))}
          onChange={() => onSelectAll(clips.map(c => c.id))}
          onClick={e => e.stopPropagation()}
          className={css.selectAllClipsCheckbox}
        />

        <div className={css.selectedClipsCount}>
          {clips.filter(c => selectedIds.includes(c.id)).length || '--'} of{' '}
          {clips.length}
        </div>

        <h2 className={css.mediaFileName}>
          {media.name}{' '}
          <small>
            {formatDuration(
              moment.duration({ seconds: media.durationSeconds })
            )}
          </small>
        </h2>

        <div className={css.fileTagChips}>
          {open
            ? ' '
            : [
                ...clips.reduce((tags, clip) => {
                  clip.flashcard.tags.forEach(tag => tags.add(tag))
                  return tags
                }, new Set()),
              ].map(tag => (
                <span key={tag} className={css.smallTag}>{`${tag}`}</span>
              ))}
        </div>

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
          <TableBody>
            {clips.map(({ id, flashcard }, i) => (
              <FlashcardRow
                id={id}
                flashcard={flashcard}
                key={flashcard.id}
                closeModal={closeDialog}
                onSelect={onSelect}
                isHighlighted={highlightedClipId === id}
                isSelected={selectedIds.includes(id)}
              />
            ))}
          </TableBody>
        )}
      </Table>
    </Paper>
  )
MediaTable = connect((state, { open, media }) => ({
  clips: r.getClips(state, media.id),
  highlightedClipId: r.getHighlightedClipId(state),
}))(MediaTable)

const Export = ({
  closeDialog,
  flashcards,
  currentFileId,
  highlightClip,
  csvAndMp3ExportDialog,
  exportApkgRequest,
  exportMarkdown,
  noteType,
  open,
  projectMedia,
  allProjectClipsIds,
  openFileRequest,
  currentMedia,
}) => {
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  const [selectionHasStarted, setSelectionHasStarted] = useState(false)
  const chooseTab = index => {
    setCurrentTabIndex(index)
    setSelectionHasStarted(false)
  }

  const [selectedIds, setSelectedIds] = useState(allProjectClipsIds)

  const onSelect = id =>
    setSelectedIds(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : selectedIds.concat(id)
    )
  const onSelectAll = ids =>
    setSelectedIds(
      ids.every(id => selectedIds.includes(id))
        ? selectedIds.filter(id => !ids.includes(id))
        : [...new Set([...selectedIds, ...ids])]
    )
  const [expandedTableIndex, setExpandedTableIndex] = useState(() =>
    projectMedia.findIndex(metadata => metadata.id === currentFileId)
  )
  const onClickTable = index => {
    const mediaMetadata = projectMedia[index]
    if (mediaMetadata && mediaMetadata.id !== currentMedia.id)
      openFileRequest(mediaMetadata)
    setExpandedTableIndex(index)
  }
  // PaperProps={{ style: { minWidth: '600px', minHeight: '300px' } }}
  return (
    <Dialog open={open} onClose={closeDialog} fullScreen={selectionHasStarted}>
      <Tabs value={currentTabIndex} className={css.tabs}>
        <Tab label="Export APKG" onClick={() => chooseTab(0)} />
        <Tab label="Export CSV & MP3" onClick={() => chooseTab(1)} />
        <Tab label="Export MD" onClick={() => chooseTab(2)} />
      </Tabs>
      <DialogContent>
        {currentTabIndex === 0 && (
          <section className={css.introText}>
            <p>
              Export an Anki .apkg file. This format is best for{' '}
              <strong>starting a new deck.</strong>
            </p>
            <p>
              If you want to update some flashcards you've previously exported,
              or add some new cards to a previously exported deck, you probably
              want to export CSV and MP3s.
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
              This lets you <strong>review all your notes</strong> in a handy
              text format.
            </p>
          </section>
        )}
        {selectionHasStarted &&
          projectMedia.map((metadata, i) => (
            <MediaTable
              key={metadata.id}
              open={i === expandedTableIndex}
              toggleOpen={e => onClickTable(i === expandedTableIndex ? -1 : i)}
              media={metadata}
              selectedIds={selectedIds}
              onSelect={onSelect}
              onSelectAll={onSelectAll}
            />
          ))}
      </DialogContent>
      {selectionHasStarted ? (
        <DialogActions>
          <Button onClick={() => closeDialog()}>Exit</Button>
          {currentTabIndex === 1 && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => csvAndMp3ExportDialog(selectedIds)}
            >
              Export CSV and MP3 from selected clips
            </Button>
          )}
          {currentTabIndex === 2 && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => exportMarkdown(selectedIds)}
            >
              Export Markdown from selected clips
            </Button>
          )}
          {currentTabIndex === 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => exportApkgRequest(selectedIds)}
            >
              Export Anki Deck from selected clips
            </Button>
          )}
        </DialogActions>
      ) : (
        <DialogActions>
          <Button onClick={() => closeDialog()}>Exit</Button>
          <Button onClick={() => setSelectionHasStarted(true)}>Continue</Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

const mapStateToProps = state => ({
  // flashcards: r.getFlashcardsByTime(state),
  allProjectClipsIds: r.getAllProjectClipsIds(state),
  noteType: r.getCurrentNoteType(state),
  currentMedia: r.getCurrentMediaFile(state),
  currentFileId: r.getCurrentFileId(state),
  projectMedia: r.getCurrentProjectMediaFiles(state),
})

const mapDispatchToProps = {
  exportApkgRequest: r.exportApkgRequest,
  csvAndMp3ExportDialog: r.csvAndMp3ExportDialog,
  exportMarkdown: r.exportMarkdown,
  highlightClip: r.highlightClip,
  closeDialog: r.closeDialog,
  openFileRequest: r.openFileRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Export)
