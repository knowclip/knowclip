import React, { Component } from 'react';
import { connect } from 'react-redux'
import { TextField, Button, Checkbox, FormControlLabel } from '@material-ui/core'
import ShowAll from './components/ShowAll'
import Waveform from './components/Waveform'
import logo from './logo.svg';
import * as r from './redux'
import './App.css';

const AudioFilesMenu = ({
  onClickPrevious, onClickNext, currentFilename, isPrevButtonEnabled, isNextButtonEnabled,
}) =>
  <p className="audioFilesMenu">
    <Button onClick={this.prevFile} disabled={isPrevButtonEnabled}>Previous</Button>
    <h2 className="audioFileName">
      {currentFilename}
    </h2>
    <Button onClick={this.nextFile} disabled={isNextButtonEnabled}>Next</Button>
  </p>

class App extends Component {
  state = {
    files: [],
    modalIsOpen: false,
  }

  loadAudio = (file, audioElement, svgElement) =>
    this.props.loadAudio(file, this.audio, this.svg)

  setFiles = (e) => {
    const files = [...e.target.files]
    this.setState({ files }, () => {
      this.germanInput.focus()
      this.loadAudio(files[0])
    })
    this.props.initializeFlashcards(files)
  }

  triggerFileInputClick = () => {
    this.fileInput.click()
  }

  fileInputRef = (el) => this.fileInput = el
  audioRef = (el) => this.audio = el
  germanInputRef = (el) => this.germanInput = el
  svgRef = (el) => this.svg = el

  goToFile = (index) => {
    this.props.setCurrentFile(index)
    this.loadAudio(this.state.files[index])
  }
  prevFile = () => {
    const lower = this.props.currentFileIndex - 1
    this.goToFile(lower >= 0 ? lower : 0)
  }
  nextFile = () => {
    const higher = this.props.currentFileIndex + 1
    const lastIndex = this.props.filenames.length - 1
    this.goToFile(higher <= lastIndex ? higher : lastIndex)
  }
  handleFlashcardSubmit = (e) => {
    e.preventDefault()
    this.nextFile()
    this.germanInput.focus()
  }

  setFlashcardText = (key, text) => {
    const newFlashcard = {
      ...this.props.currentFlashcard,
      [key]: text,
    }
    this.props.setFlashcardField(this.props.currentFlashcardId, key, text)
  }

  setGerman = (e) => this.setFlashcardText('de', e.target.value)
  setEnglish = (e) => this.setFlashcardText('en', e.target.value)

  getCurrentFile = () => this.props.getCurrentFile(this.state.files)

  openModal = () => this.setState({ modalIsOpen: true })
  closeModal = () => this.setState({ modalIsOpen: false })

  handleAudioEnded = (e) => {
    this.nextFile()
  }
  toggleLoop = () => this.props.toggleLoop()

  render() {
    const {
      areFilesLoaded, waveform, loop,
      isPrevButtonEnabled, isNextButtonEnabled,
      currentFlashcard, currentFileIndex, flashcards
    } = this.props
    const currentFile = this.getCurrentFile()

    const form = areFilesLoaded
      ? <section onSubmit={this.handleFlashcardSubmit}>
        <Waveform svgRef={this.svgRef} />
        <form className="form">
          <audio onEnded={this.handleAudioEnded} loop={loop} ref={this.audioRef} controls className="audioPlayer" autoplay></audio>
          <FormControlLabel
            label="Loop"
            control={
              <Checkbox checked={loop} value={loop} onChange={this.toggleLoop} />
            }
          />
          <AudioFilesMenu
            onClickPrevious={this.prevFile}
            onClickNext={this.nextFile}
            currentFilename={currentFile.name}
            isPrevButtonEnabled={isPrevButtonEnabled}
            isNextButtonEnabled={isNextButtonEnabled}
          />
          <div className="formBody">
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
            <Button type="submit" fullWidth onClick={this.submitFlashcardForm} disabled={isNextButtonEnabled}>
              Continue
            </Button>
            <Button fullWidth onClick={this.openModal}>Review &amp; export</Button>
          </div>
        </form>
      </section>
      : <p>
        Select audio files from your <a href="https://apps.ankiweb.net/docs/manual.html#files">Anki collection.media folder</a> to start making flashcards.
      </p>

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Audio Flashcard Assistant</h1>
        </header>
        <p>
          <Button label="files" onClick={this.triggerFileInputClick}>
            <input className="fileInput" multiple ref={this.fileInputRef} type="file" onChange={this.setFiles} />
          </Button>
        </p>
        {form}
        <ShowAll
          open={this.state.modalIsOpen}
          handleClose={this.closeModal}
          flashcards={flashcards}
          files={this.state.files}
          currentFileIndex={currentFileIndex}
          goToFile={this.goToFile}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  filenames: r.getFilenames(state),
  flashcards: r.getFlashcards(state),
  getCurrentFile: r.makeGetCurrentFile(state),
  currentFileIndex: r.getCurrentFileIndex(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  currentFlashcardId: r.getCurrentFlashcardId(state),
  areFilesLoaded: r.areFilesLoaded(state),
  isNextButtonEnabled: r.isNextButtonEnabled(state),
  isPrevButtonEnabled: r.isPrevButtonEnabled(state),
  loop: r.isLoopOn(state),
})

const mapDispatchToProps = {
  initializeFlashcards: r.initializeFlashcards,
  setCurrentFile: r.setCurrentFile,
  setFlashcardField: r.setFlashcardField,
  toggleLoop: r.toggleLoop,
  loadAudio: r.loadAudio,
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
