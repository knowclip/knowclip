import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import {
  TextField,
  Button,
  IconButton,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Tooltip,
} from '@material-ui/core'
import {
  Hearing as HearingIcon,
  Delete as DeleteIcon,
} from '@material-ui/icons'
import { Link } from 'react-router-dom'
import formatTime from '../utils/formatTime'
import ShowAll from '../components/ShowAll'
import Waveform from '../components/Waveform'
import AudioFilesNavMenu from '../components/AudioFilesNavMenu'
import DefineSchemaForm from '../components/DefineSchemaForm'
import * as r from '../redux'
import electron from 'electron'

const { remote } = electron
const { dialog } = remote

class FlashcardForm extends Component {
  state = {
    filePaths: [],
    modalIsOpen: false,
  }

  fileInputRef = el => (this.fileInput = el)
  audioRef = el => (this.audio = el)
  germanInputRef = el => (this.germanInput = el)
  svgRef = el => (this.svg = el)

  goToFile = index => this.props.setCurrentFile(index)
  prevFile = () => {
    const lower = this.props.currentFileIndex - 1
    this.goToFile(lower >= 0 ? lower : 0)
  }
  nextFile = () => {
    const higher = this.props.currentFileIndex + 1
    const lastIndex = this.props.filePaths.length - 1
    this.goToFile(higher <= lastIndex ? higher : lastIndex)
  }
  handleFlashcardSubmit = e => {
    e.preventDefault()
    this.nextFile()
    this.germanInput.focus()
  }

  setFlashcardText = (key, text) => {
    this.props.setFlashcardField(this.props.currentFlashcardId, key, text)
  }

  setGerman = e => this.setFlashcardText('de', e.target.value)
  setEnglish = e => this.setFlashcardText('en', e.target.value)

  deleteCard = () => {
    const { deleteCard, highlightedWaveformSelectionId } = this.props
    if (highlightedWaveformSelectionId) {
      deleteCard(highlightedWaveformSelectionId)
    }
  }

  openModal = () => this.setState({ modalIsOpen: true })
  closeModal = () => this.setState({ modalIsOpen: false })

  handleAudioEnded = e => {
    this.nextFile()
  }
  toggleLoop = () => this.props.toggleLoop()

  inputRefs = {}
  inputRef = name => el => (this.inputRefs[name] = el)

  render() {
    const { loop, currentFlashcard, currentNoteType } = this.props

    if (!currentNoteType) return <DefineSchemaForm />

    return (
      <section onSubmit={this.handleFlashcardSubmit}>
        <form className="form">
          <FormControlLabel
            label="Loop"
            control={
              <Checkbox
                checked={loop}
                value={loop}
                onChange={this.toggleLoop}
              />
            }
          />
          <div className="formBody">
            <p>
              {formatTime(currentFlashcard.time.from)}-
              {formatTime(currentFlashcard.time.until)}
            </p>
            <Button type="button" onClick={this.deleteCard}>
              Delete card
            </Button>

            {/* inputProps={{ lang: 'de' }} */}

            {currentNoteType.fields.map(({ name }) => (
              <TextField
                inputRef={this.inputRef(name)}
                onChange={e => this.setFlashcardText(name, e.target.value)}
                value={currentFlashcard.fields[name]}
                fullWidth
                multiline
                label={name}
              />
            ))}
          </div>
        </form>
      </section>
    )
  }
}

const mapStateToProps = state => ({
  filePaths: r.getFilePaths(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  currentFlashcardId: r.getCurrentFlashcardId(state),
  loop: r.isLoopOn(state),
  highlightedWaveformSelectionId: r.getHighlightedWaveformSelectionId(state),
  clipsTimes: r.getClipsTimes(state),
  currentNoteType: r.getCurrentNoteType(state),
})

const mapDispatchToProps = {
  setCurrentFile: r.setCurrentFile,
  setFlashcardField: r.setFlashcardField,
  toggleLoop: r.toggleLoop,
  deleteCard: r.deleteCard,
  makeClips: r.makeClips,
  exportFlashcards: r.exportFlashcards,
  highlightSelection: r.highlightSelection,
  initializeApp: r.initializeApp,
  detectSilenceRequest: r.detectSilenceRequest,
  deleteAllCurrentFileClipsRequest: r.deleteAllCurrentFileClipsRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlashcardForm)
