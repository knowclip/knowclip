import React, { Component, useRef } from 'react'
import { connect } from 'react-redux'
import {
  TextField,
  IconButton,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Tooltip,
} from '@material-ui/core'
import { Delete as DeleteIcon, Loop } from '@material-ui/icons'
import formatTime from '../utils/formatTime'
import * as r from '../redux'
import css from './FlashcardSection.module.css'
import { getNoteTypeFields } from '../utils/noteType'
import {
  ChevronLeft,
  ChevronRight,
  Subtitles,
  Hearing,
  Layers,
  PlayArrow,
  Pause,
} from '@material-ui/icons'
import TagsInput from './TagsInput'

const capitalize = string =>
  string.substring(0, 1).toUpperCase() + string.slice(1)

let Field = ({ id, currentFlashcard, name, setFlashcardText }) => {
  const handleChange = useRef(e => setFlashcardText(id, e.target.value))
  return (
    <section>
      <TextField
        onChange={handleChange.current}
        value={currentFlashcard.fields[id] || ''}
        fullWidth
        multiline
        margin="dense"
        label={name}
      />
    </section>
  )
}

class FlashcardSection extends Component {
  state = {
    moreMenuAnchorEl: null,
    // textFieldInput: '', // ???? necessary?
  }

  handleClickMoreButton = event => {
    this.setState({ moreMenuAnchorEl: event.currentTarget })
  }

  handleCloseMoreMenu = () => {
    this.setState({ moreMenuAnchorEl: null })
  }

  handleClickDeleteButton = () => {
    const { confirmationDialog, selectedClipId } = this.props
    confirmationDialog(
      'Are you sure you want to delete this clip and flashcard?',
      r.deleteCard(selectedClipId)
    )
  }

  handleFlashcardSubmit = e => {
    e.preventDefault()
  }

  setFlashcardText = (key, text) => {
    this.props.setFlashcardField(this.props.selectedClipId, key, text)
  }
  // setFlashcardTagsText = text =>
  // this.props.setFlashcardTagsText(this.props.selectedClipId, text)

  deleteCard = () => {
    const { deleteCard, highlightedClipId } = this.props
    if (highlightedClipId) {
      deleteCard(highlightedClipId)
    }
  }

  render() {
    const {
      currentFlashcard,
      selectedClipTime,
      currentNoteType,
      toggleLoop,
      isLoopOn,
      showing,
      prevId,
      nextId,
      highlightClip,
      allTags,
      addFlashcardTag,
      selectedClipId,
      deleteFlashcardTag,
    } = this.props
    const { moreMenuAnchorEl } = this.state

    return (
      <section className={css.container}>
        <Tooltip
          title="Previous clip (Ctrl + comma)"
          PopperProps={{ style: { fontSize: '1.4em !important' } }}
        >
          <span>
            {' '}
            <IconButton
              className={css.navButton}
              disabled={!prevId}
              onClick={() => highlightClip(prevId)}
            >
              <ChevronLeft />
            </IconButton>
          </span>
        </Tooltip>

        <Card className={css.form}>
          {!showing ? (
            <CardContent className={css.intro}>
              <p className={css.introText}>
                You can <strong>create clips</strong> in a few different ways:
              </p>
              <ul className={css.introList}>
                <li>
                  Manually <strong>click and drag</strong> on the waveform
                </li>

                <li>
                  Use <Hearing className={css.icon} />{' '}
                  <strong>silence detection</strong> to automatically make clips
                  from audio containing little background noise.
                </li>
                <li>
                  Use <Subtitles className={css.icon} />{' '}
                  <strong>subtitles</strong> to automatically create both clips
                  and flashcards.
                </li>
              </ul>
              <p className={css.introText}>
                When you're done, press the <Layers className={css.icon} />{' '}
                <strong>export button</strong>.
              </p>

              <p className={css.introText}>
                You can <PlayArrow className={css.icon} /> /{' '}
                <Pause className={css.icon} /> <b>play</b>/<b>pause</b> media
                with <i>Ctrl + space</i>.
              </p>
            </CardContent>
          ) : (
            <CardContent>
              <form className="form" onSubmit={this.handleFlashcardSubmit}>
                <div className="formBody">
                  <section className={css.timeStamp}>
                    {formatTime(selectedClipTime.start)}
                    {' - '}
                    {formatTime(selectedClipTime.end)}
                    <Tooltip title="Loop audio (Ctrl + L)">
                      <IconButton
                        onClick={toggleLoop}
                        color={isLoopOn ? 'secondary' : 'default'}
                      >
                        <Loop />
                      </IconButton>
                    </Tooltip>
                  </section>
                  {getNoteTypeFields(currentNoteType).map(id => (
                    <Field
                      key={`${id}_${currentFlashcard.id}`}
                      id={id}
                      currentFlashcard={currentFlashcard}
                      name={capitalize(id)}
                      setFlashcardText={this.setFlashcardText}
                    />
                  ))}
                  <TagsInput
                    allTags={allTags}
                    tags={currentFlashcard.tags}
                    onAddChip={text => addFlashcardTag(selectedClipId, text)}
                    onDeleteChip={(index, text) =>
                      deleteFlashcardTag(selectedClipId, index, text)
                    }
                  />

                  <section className={css.bottom}>
                    {/* <span className={css.noteTypeName}>
                  Using card template:{' '}
                  <Tooltip title="Edit card template">
                    <span
                      className={css.noteTypeNameLink}
                      onClick={this.editCardTemplate}
                      tabIndex={0}
                    >
                      {currentNoteType.name}
                    </span>
                  </Tooltip>
                </span> */}
                    <IconButton
                      className={css.moreMenuButton}
                      onClick={this.handleClickDeleteButton}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <Menu
                      anchorEl={moreMenuAnchorEl}
                      open={Boolean(moreMenuAnchorEl)}
                      onClose={this.handleCloseMoreMenu}
                    >
                      {/* <MenuItem onClick={this.editCardTemplate}>
                    Edit card template
                  </MenuItem> */}
                      <MenuItem onClick={this.deleteCard}>Delete card</MenuItem>
                    </Menu>
                  </section>
                  {/* <IconButton
                className={css.deleteButton}
                onClick={this.deleteCard}
              >
                <DeleteIcon />
              </IconButton> */}
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        <Tooltip title="Next clip (Ctrl + period)">
          <span>
            <IconButton
              className={css.navButton}
              disabled={!nextId}
              onClick={() => highlightClip(nextId)}
            >
              <ChevronRight />
            </IconButton>
          </span>
        </Tooltip>
      </section>
    )
  }
}

const mapStateToProps = state => ({
  allTags: r.getAllTags(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  selectedClipId: r.getSelectedClipId(state),
  selectedClipTime: r.getSelectedClipTime(state),
  highlightedClipId: r.getHighlightedClipId(state),
  clipsTimes: r.getClipsTimes(state),
  currentNoteType: r.getCurrentNoteType(state),
  isLoopOn: r.isLoopOn(state),
  prevId: r.getFlashcardIdBeforeCurrent(state),
  nextId: r.getFlashcardIdAfterCurrent(state),
})

const mapDispatchToProps = {
  setFlashcardField: r.setFlashcardField,
  deleteCard: r.deleteCard,
  confirmationDialog: r.confirmationDialog,
  highlightClip: r.highlightClip,
  initializeApp: r.initializeApp,
  addFlashcardTag: r.addFlashcardTag,
  deleteFlashcardTag: r.deleteFlashcardTag,
  toggleLoop: r.toggleLoop,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlashcardSection)
