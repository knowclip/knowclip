import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  TextField,
  IconButton,
  Card,
  CardContent,
  Menu,
  MenuList,
  MenuItem,
  Tooltip,
  Paper,
} from '@material-ui/core'
import { Delete as DeleteIcon, Loop } from '@material-ui/icons'
import ChipInput from 'material-ui-chip-input'
import formatTime from '../utils/formatTime'
import * as r from '../redux'
import css from './FlashcardForm.module.css'
import Autosuggest from 'react-autosuggest'

class FlashcardForm extends Component {
  state = {
    moreMenuAnchorEl: null,
    textFieldInput: '', // ???? necessary?
    suggestions: [],
  }
  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: this.getSuggestions(value),
    })
  }
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    })
  }

  getSuggestions = value => {
    const inputValue = value.trim().toLowerCase()

    return inputValue.length === 0
      ? []
      : this.props.allTags.filter(tag =>
          tag.toLowerCase().startsWith(inputValue)
        )
  }

  renderSuggestionsContainer = ({ children, containerProps }) => (
    <Paper {...containerProps} square>
      {children}
    </Paper>
  )
  getSuggestionValue = a => a
  renderSuggestion = (suggestion, { query, isHighlighted, ...other }) => {
    // const matches = match(suggestion.name, query)
    // const parts = parse(suggestion.name, matches)

    return (
      <MenuItem
        selected={isHighlighted}
        onMouseDown={e => e.preventDefault()} // prevent the click causing the input to be blurred
        {...other}
      >
        {/* {parts.map((part, index) => {
            return part.highlight ? (
              <span key={String(index)} style={{ fontWeight: 500 }}>
                {part.text}
              </span>
            ) : (
              <span key={String(index)}>{part.text}</span>
            )
          })} */}
        {suggestion}
      </MenuItem>
    )
  }

  renderChipsInput = ({ value, onChange, chips, ref, ...other }) => (
    <ChipInput
      label="Tags"
      placeholder="Type your tag and press 'enter'"
      className={css.tagsField}
      inputRef={ref}
      value={this.props.currentFlashcard.tags || []}
      fullWidth
      onAdd={chip => this.handleAddChip(chip)}
      onDelete={(chip, index) => this.handleDeleteChip(chip, index)}
      dataSource={this.props.allTags}
      newChipKeyCodes={[13, 9, 32]}
      openOnFocus
      onUpdateInput={onChange}
      value={chips}
      clearInputValueOnChange
      {...other}
    />
  )

  handletextFieldInputChange = (e, { newValue }) =>
    this.setState({ textFieldInput: newValue })

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

  handleAddChip = text => {
    this.setState({ textFieldInput: '' })
    console.log('addFlashcardTag', text)
    this.props.addFlashcardTag(this.props.selectedClipId, text)
  }
  handleDeleteChip = (text, index) =>
    this.props.deleteFlashcardTag(this.props.selectedClipId, index, text)

  deleteCard = () => {
    const { deleteCard, highlightedClipId } = this.props
    if (highlightedClipId) {
      deleteCard(highlightedClipId)
    }
  }

  editCardTemplate = () =>
    this.props.editNoteTypeDialog(this.props.currentNoteType.id)

  inputRefs = {}
  inputRef = name => el => (this.inputRefs[name] = el)

  render() {
    const {
      currentFlashcard,
      selectedClipTime,
      currentNoteType,
      toggleLoop,
      isLoopOn,
      allTags,
    } = this.props
    const { moreMenuAnchorEl, suggestions } = this.state

    return (
      <Card className={css.container}>
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
              {currentNoteType.fields.map(({ name, id }) => (
                <section key={`${id}_${currentFlashcard.id}`}>
                  <TextField
                    inputRef={this.inputRef(id)}
                    onChange={e => this.setFlashcardText(id, e.target.value)}
                    value={currentFlashcard.fields[id] || ''}
                    fullWidth
                    multiline
                    label={name}
                  />
                </section>
              ))}

              {currentNoteType.useTagsField && (
                <Autosuggest
                  theme={{
                    suggestionsList: css.suggestionsList,
                  }}
                  suggestions={suggestions}
                  onSuggestionSelected={(e, { suggestionValue }) => {
                    this.handleAddChip(suggestionValue)
                    e.preventDefault()
                  }}
                  onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                  onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                  renderSuggestionsContainer={this.renderSuggestionsContainer}
                  getSuggestionValue={this.getSuggestionValue}
                  renderSuggestion={this.renderSuggestion}
                  focusInputOnSuggestionClick={false}
                  shouldRenderSuggestions={value =>
                    value && value.trim().length > 0
                  }
                  inputProps={{
                    chips: currentFlashcard.tags || [],
                    value: this.state.textFieldInput,
                    onChange: this.handletextFieldInputChange,
                    onAdd: chip => this.handleAddChip(chip),
                    onDelete: (chip, index) =>
                      this.handleDeleteChip(chip, index),
                  }}
                  renderInputComponent={this.renderChipsInput}
                />
              )}

              <section className={css.bottom}>
                <span className={css.noteTypeName}>
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
                </span>
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
                  <MenuItem onClick={this.editCardTemplate}>
                    Edit card template
                  </MenuItem>
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
      </Card>
    )
  }
}

const mapStateToProps = state => ({
  currentFlashcard: r.getCurrentFlashcard(state),
  selectedClipTime: r.getSelectedClipTime(state),
  selectedClipId: r.getSelectedClipId(state),
  highlightedClipId: r.getHighlightedClipId(state),
  clipsTimes: r.getClipsTimes(state),
  currentNoteType: r.getCurrentNoteType(state),
  isLoopOn: r.isLoopOn(state),
  allTags: r.getAllTags(state),
})

const mapDispatchToProps = {
  setFlashcardField: r.setFlashcardField,
  deleteCard: r.deleteCard,
  confirmationDialog: r.confirmationDialog,
  highlightClip: r.highlightClip,
  initializeApp: r.initializeApp,
  // // setFlashcardTagsText: r.setFlashcardTagsText,
  addFlashcardTag: r.addFlashcardTag,
  deleteFlashcardTag: r.deleteFlashcardTag,
  editNoteTypeDialog: r.editNoteTypeDialog,
  toggleLoop: r.toggleLoop,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlashcardForm)
