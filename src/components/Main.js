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
import ShowAll from '../components/ShowAll'
import Waveform from '../components/Waveform'
import AudioFilesNavMenu from '../components/AudioFilesNavMenu'
import * as r from '../redux'
import electron from 'electron'

const { remote } = electron
const { dialog } = remote

class App extends Component {
  state = {
    filePaths: [],
    modalIsOpen: false,
  }

  componentDidMount() {
    this.props.initializeApp()
  }

  chooseAudioFiles = () => {
    dialog.showOpenDialog(
      { properties: ['openFile', 'multiSelections'] },
      filePaths => {
        if (!filePaths) return
        this.setState({ filePaths }, async () => {
          // now, this line
          // should really happen after a clip is selected.
          // this.germanInput.focus()

          this.props.chooseAudioFiles(filePaths)
        })
      }
    )
  }

  removeAudioFiles = () => this.props.chooseAudioFiles([])

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

  render() {
    const {
      loop,
      isPrevButtonEnabled,
      isNextButtonEnabled,
      currentFlashcard,
      currentFileIndex,
      flashcards,
      currentFileName,
      makeClips,
      exportFlashcards,
      highlightSelection,
      audioIsLoading,
      mediaFolderLocation,
      detectSilenceRequest,
      deleteAllCurrentFileClipsRequest,
    } = this.props

    const form = Boolean(currentFlashcard) ? (
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
              {currentFlashcard.time.from}-{currentFlashcard.time.until}
            </p>
            <Button type="button" onClick={this.deleteCard}>
              Delete card
            </Button>
            <TextField
              inputRef={this.germanInputRef}
              onChange={this.setGerman}
              value={currentFlashcard.de}
              fullWidth
              multiline
              label="German"
              inputProps={{ lang: 'de' }}
            />
            <TextField
              onChange={this.setEnglish}
              value={currentFlashcard.en}
              fullWidth
              multiline
              label="English"
              inputProps={{ lang: 'en' }}
            />
            <Button
              type="submit"
              fullWidth
              onClick={this.submitFlashcardForm}
              disabled={isNextButtonEnabled}
            >
              Continue
            </Button>
            <Button fullWidth onClick={this.openModal}>
              Review &amp; export
            </Button>
          </div>
        </form>
      </section>
    ) : (
      <p>Click + drag to make audio clips and start making flashcards.</p>
    )

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Audio Flashcard Assistant</h1>
          <p>
            <Link to="/media-folder-location">
              audio will be saved in: {mediaFolderLocation}
            </Link>
          </p>
        </header>
        <AudioFilesNavMenu
          onClickPrevious={this.prevFile}
          onClickNext={this.nextFile}
          currentFilename={currentFileName}
          isPrevButtonEnabled={isPrevButtonEnabled}
          isNextButtonEnabled={isNextButtonEnabled}
          chooseAudioFiles={this.chooseAudioFiles}
          removeAudioFiles={this.removeAudioFiles}
        />
        <Waveform show={!audioIsLoading} svgRef={this.svgRef} />
        {audioIsLoading && (
          <div className="waveform-placeholder">
            <CircularProgress />
          </div>
        )}
        <p>
          <audio
            onEnded={this.handleAudioEnded}
            loop={loop}
            ref={this.audioRef}
            controls
            id="audioPlayer"
            className="audioPlayer"
            controlsList="nodownload"
            autoPlay
          />
          <Tooltip title="Detect silences">
            <IconButton onClick={detectSilenceRequest}>
              <HearingIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete all clips for this file">
            <IconButton onClick={deleteAllCurrentFileClipsRequest}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </p>
        {form}
        <ShowAll
          open={this.state.modalIsOpen}
          handleClose={this.closeModal}
          flashcards={flashcards}
          files={null /* this.state.files */}
          currentFileIndex={currentFileIndex}
          highlightSelection={highlightSelection}
          makeClips={makeClips}
          exportFlashcards={exportFlashcards}
        />
      </div>
    )
  }
}

const mapStateToProps = state => ({
  filePaths: r.getFilePaths(state),
  flashcards: r.getFlashcardsByTime(state),
  currentFileIndex: r.getCurrentFileIndex(state),
  currentFileName: r.getCurrentFileName(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  currentFlashcardId: r.getCurrentFlashcardId(state),
  isNextButtonEnabled: r.isNextButtonEnabled(state),
  isPrevButtonEnabled: r.isPrevButtonEnabled(state),
  loop: r.isLoopOn(state),
  highlightedWaveformSelectionId: r.getHighlightedWaveformSelectionId(state),
  clipsTimes: r.getClipsTimes(state),
  audioIsLoading: r.isAudioLoading(state),
  mediaFolderLocation: r.getMediaFolderLocation(state),
})

const mapDispatchToProps = {
  chooseAudioFiles: r.chooseAudioFiles,
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
)(App)
