import React, { useState, useRef, Fragment } from 'react'
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
  Tooltip,
  Tabs,
  Tab,
  Popover,
  FormControlLabel,
  FormControl,
  FormGroup,
  Checkbox,
  Chip,
  IconButton,
} from '@material-ui/core'
import { ExpandLess, ExpandMore } from '@material-ui/icons'
import * as r from '../redux'
import truncate from '../utils/truncate'
import css from './Export.module.css'
import cn from 'classnames'
import moment from 'moment'

const MediaMenu = ({
  menuIsOpen,
  anchorEl,
  closeMenu,
  projectMediaMetadata,
  selectedIds,
  onChangeCheckbox,
}) =>
  menuIsOpen && (
    <Popover anchorEl={anchorEl} open={menuIsOpen} onClose={closeMenu}>
      <FormControl component="fieldset">
        <FormGroup>
          {projectMediaMetadata.map(({ name, id }) => (
            <FormControlLabel
              label={name}
              control={
                <Checkbox
                  checked={selectedIds.includes(id)}
                  onChange={() => onChangeCheckbox(id)}
                />
              }
            />
          ))}
        </FormGroup>
      </FormControl>
    </Popover>
  )

let FlashcardRow = ({
  flashcard: { fields, id, tags },
  highlightClip,
  closeModal,
  file,
  isSelected,
  formattedClipTime,
  onSelect,
}) => (
  <TableRow
    className={css.tableRow}
    onClick={() => highlightClip(id)}
    onDoubleClick={closeModal}
  >
    <TableCell padding="checkbox">
      <Checkbox checked={isSelected} onChange={e => onSelect(id)} />
    </TableCell>
    <TableCell padding="default">
      {' '}
      <span className={css.clipTime}>{formattedClipTime}</span>
    </TableCell>
    <TableCell className={css.flashcardContents}>
      <p
        className={cn(css.transcription, {
          [css.blank]: !fields.transcription,
        })}
      >
        {fields.transcription.trim() || '[no transcription given]'}
      </p>
      {fields.pronunciation && (
        <p className={css.pronunciation}>{fields.pronunciation}</p>
      )}
      <p className={cn(css.meaning, { [css.blank]: !fields.meaning })}>
        {fields.meaning.trim() || '[no meaning given]'}
      </p>
    </TableCell>
    {/* {Object.entries(fields).map(([fieldName, fieldText]) => (
      <TableCell key={fieldName}>
        <Field text={fieldText} />
      </TableCell>
    ))} */}
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
  }),
  { highlightClip: r.highlightClip }
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
  mediaFileMetadata,
  clips,
  open,
  closeDialog,
  selectedIds,
  onSelect,
  onSelectAll,
  toggleOpen,
}) => (
  <Fragment>
    <Toolbar className={css.toolbar}>
      <Checkbox
        checked={clips.every(c => selectedIds.includes(c.id))}
        onChange={() => onSelectAll(clips.map(c => c.id))}
        className={css.selectAllClipsCheckbox}
      />

      <div className={css.selectedClipsCount}>
        {clips.filter(c => selectedIds.includes(c.id)).length || '--'} of{' '}
        {clips.length}
      </div>

      <h2 className={css.mediaFileName}>
        {mediaFileMetadata.name}{' '}
        <small>
          {formatDuration(
            moment.duration({ seconds: mediaFileMetadata.durationSeconds })
          )}
        </small>
      </h2>

      <IconButton onClick={toggleOpen}>
        {open ? <ExpandLess /> : <ExpandMore />}
      </IconButton>

      <div className={css.fileTagChips}>
        {!open &&
          [
            ...clips.reduce((tags, clip) => {
              clip.flashcard.tags.forEach(tag => tags.add(tag))
              return tags
            }, new Set()),
          ]
            .sort()
            .map(tag => (
              <Fragment>
                <Chip key={tag} label={tag} />{' '}
              </Fragment>
            ))}
      </div>
    </Toolbar>
    <Table className={css.table}>
      <colgroup>
        <col width="1%" />
        <col width="15%" />
        <col width="70%" />
        <col width="10%" />
        <col width="10%" />
      </colgroup>
      {/* <TableHead className={css.tableHead}>
        <TableRow className={css.tableRow}>
          <TableCell padding="checkbox">
            <Checkbox
              checked={clips.every(c => selectedIds.includes(c.id))}
              onChange={() => onSelectAll(clips.map(c => c.id))}
            />
          </TableCell>{' '}
        </TableRow>{' '}
      </TableHead> */}
      {open && (
        <TableBody>
          {clips.map(({ id, flashcard }, i) => (
            <FlashcardRow
              id={id}
              flashcard={flashcard}
              key={flashcard.id}
              closeModal={closeDialog}
              onSelect={onSelect}
              isSelected={selectedIds.includes(id)}
            />
          ))}
        </TableBody>
      )}
    </Table>
  </Fragment>
)
MediaTable = connect((state, { open, mediaFileMetadata }) => ({
  clips: r.getClips(state, mediaFileMetadata.id),
}))(MediaTable)

const Export = ({
  closeDialog,
  flashcards,
  currentFileIndex,
  highlightClip,
  exportCsv,
  exportApkg,
  exportMarkdown,
  noteType,
  open,
  projectMediaMetadata,
  allProjectClipsIds,
}) => {
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  const menuAnchorEl = useRef(null)
  // const [menuIsOpen, setMenuIsOpen] = useState(false)
  // const openMenu = e => setMenuIsOpen(true)
  // const closeMenu = e => setMenuIsOpen(false)

  const [selectedIds, setSelectedIds] = useState(allProjectClipsIds)
  // const handleChangeCheckbox = id => {
  //   if (selectedIds.includes(id))
  //     setSelectedIds(selectedIds.filter(x => x !== id))
  //   else setSelectedIds(selectedIds.concat(id))
  // }

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
  const [expandedTableIndex, setExpandedTableIndex] = useState(-1)

  return (
    <Dialog open={open} onClose={closeDialog} fullScreen>
      <DialogContent>
        <Tabs value={currentTabIndex}>
          <Tab label="Export APKG" onClick={() => setCurrentTabIndex(0)} />
          <Tab label="Export CSV & MP3" onClick={() => setCurrentTabIndex(1)} />
          <Tab label="Export MD" onClick={() => setCurrentTabIndex(2)} />
        </Tabs>
        {/* <Button onClick={openMenu} buttonRef={menuAnchorEl}>
          {selectedIds.length} media files selected
        </Button>
        <MediaMenu
          menuIsOpen={menuIsOpen}
          closeMenu={closeMenu}
          projectMediaMetadata={projectMediaMetadata}
          selectedIds={selectedIds}
          anchorEl={menuAnchorEl.current}
          onChangeCheckbox={handleChangeCheckbox}
        /> */}
        {projectMediaMetadata.map((metadata, i) => (
          <MediaTable
            key={metadata.id}
            open={i === expandedTableIndex}
            toggleOpen={e =>
              setExpandedTableIndex(i === expandedTableIndex ? -1 : i)
            }
            mediaFileMetadata={metadata}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onSelectAll={onSelectAll}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => closeDialog()}>Exit</Button>
        <Tooltip title="Good for updating existing deck">
          <Button onClick={() => exportCsv()}>Export CSV and MP3</Button>
        </Tooltip>
        <Tooltip title="Create a document for at-a-glance reviews">
          <Button onClick={() => exportMarkdown()}>Export Markdown</Button>
        </Tooltip>
        <Tooltip title="Good for starting new deck">
          <Button
            variant="contained"
            color="primary"
            onClick={() => exportApkg()}
          >
            Export Anki Deck
          </Button>
        </Tooltip>
      </DialogActions>
    </Dialog>
  )
}

const mapStateToProps = state => ({
  // flashcards: r.getFlashcardsByTime(state),
  allProjectClipsIds: r.getAllProjectClipsIds(state),
  noteType: r.getCurrentNoteType(state),
  projectMediaMetadata: r.getProjectMediaMetadata(
    state,
    r.getCurrentProjectId(state)
  ),
})

const mapDispatchToProps = {
  exportApkg: r.exportApkg,
  exportCsv: r.exportCsv,
  exportMarkdown: r.exportMarkdown,
  highlightClip: r.highlightClip,
  closeDialog: r.closeDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Export)
