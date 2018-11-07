import React, { Component } from 'react';
import { connect } from 'react-redux'
import { TextField, Button, Checkbox, FormControlLabel } from '@material-ui/core'
import ShowAll from './components/ShowAll'
import Waveform from './components/Waveform'
import logo from './logo.svg';
import * as r from './redux'
import is from 'electron-is'
import './App.css';
import electron from 'electron'
import { promisify } from 'util'
import fs from 'fs'

const { remote } = electron
const { dialog } = remote
const readFile = promisify(fs.readFile)

const isNotMac = process.platform !== 'darwin'

const AudioFilesMenu = ({
  onClickPrevious, onClickNext, currentFilename, isPrevButtonEnabled, isNextButtonEnabled,
  chooseAudioFiles,
}) =>
  <p className="audioFilesMenu">
    <Button onClick={onClickPrevious} disabled={!isPrevButtonEnabled}>Previous</Button>
    {currentFilename
      ? <h2 className="audioFileName">
        {currentFilename}
      </h2>
      : <Button onClick={chooseAudioFiles}>
        Choose audio files
      </Button>
    }
    <Button onClick={onClickNext} disabled={!isNextButtonEnabled}>Next</Button>
  </p>

class App extends Component {
  state = {
    filePaths: [],
    modalIsOpen: false,
  }

  loadAudio = (file, audioElement, svgElement) =>
    this.props.loadAudio(file, this.audio, this.svg)

  // these two methods are for browser
  // setFiles = (e) => {
  //   const files = [...e.target.files]
  //   this.setState({ files }, () => {
  //     // now, this line
  //     // should really happen after a clip is selected.
  //     // this.germanInput.focus()
  //     this.loadAudio(files[0])
  //   })
  //   this.props.chooseAudioFiles(files)
  // }
  //
  // triggerFileInputClick = () => {
  //   this.fileInput.click()
  // }

  chooseAudioFiles = () => {
    dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] }, (filePaths) => {
      if (!filePaths) return
      this.setState({ filePaths }, async () => {
        // now, this line
        // should really happen after a clip is selected.
        // this.germanInput.focus()
        const file = await readFile(filePaths[0])
          this.loadAudio(file)
          // does chooseAudioFiles really need to happen here?
          this.props.chooseAudioFiles(filePaths)
      })
    })
  }

  fileInputRef = (el) => this.fileInput = el
  audioRef = (el) => this.audio = el
  germanInputRef = (el) => this.germanInput = el
  svgRef = (el) => this.svg = el

  goToFile = async (index) => {
    this.props.setCurrentFile(index)
    const file = await readFile(this.state.filePaths[index])
    this.loadAudio(file)
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

  deleteCard = () => {
    const { deleteCard, highlightedWaveformSelectionId } = this.props
    if (highlightedWaveformSelectionId) {
      deleteCard(highlightedWaveformSelectionId)
    }
  }


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
      currentFlashcard, currentFileIndex, flashcards,
      currentFileName, makeClips, highlightSelection,
    } = this.props

    // for reference during transition to clip-based flashcards
    const form = Boolean(currentFlashcard)
      ? <section onSubmit={this.handleFlashcardSubmit}>
        <form className="form">
          <FormControlLabel
            label="Loop"
            control={
              <Checkbox checked={loop} value={loop} onChange={this.toggleLoop} />
            }
          />
          <div className="formBody">
            <p>{currentFlashcard.time.from}-{currentFlashcard.time.until}</p>
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
            <Button type="submit" fullWidth onClick={this.submitFlashcardForm} disabled={isNextButtonEnabled}>
              Continue
            </Button>
            <Button fullWidth onClick={this.openModal}>Review &amp; export</Button>
          </div>
        </form>
      </section>
      : <p>
        Select audio files from your <a href="https://apps.ankiweb.net/docs/manual.html#files">Anki collection.media folder</a> and click + drag to make audio clips and start making flashcards.
      </p>

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Audio Flashcard Assistant</h1>
          {isNotMac && 'Only Mac OS is currently supported.'}
        </header>
        <p>
          {/* <Button label="files" onClick={this.triggerFileInputClick}>
            <input className="fileInput" multiple ref={this.fileInputRef} type="file" onChange={this.setFiles} />
            Open file
          </Button> */}
        </p>
        <AudioFilesMenu
          onClickPrevious={this.prevFile}
          onClickNext={this.nextFile}
          currentFilename={currentFileName}
          isPrevButtonEnabled={isPrevButtonEnabled}
          isNextButtonEnabled={isNextButtonEnabled}
          chooseAudioFiles={this.chooseAudioFiles}
        />
        <Waveform svgRef={this.svgRef} />
        <audio onEnded={this.handleAudioEnded} loop={loop} ref={this.audioRef} controls className="audioPlayer" autoPlay></audio>
        {form}
        <ShowAll
          open={this.state.modalIsOpen}
          handleClose={this.closeModal}
          flashcards={flashcards}
          files={null /* this.state.files */}
          currentFileIndex={currentFileIndex}
          highlightSelection={highlightSelection}
          makeClips={makeClips}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  filenames: r.getFilenames(state),
  flashcards: r.getFlashcardsByTime(state),
  currentFileIndex: r.getCurrentFileIndex(state),
  currentFileName: r.getCurrentFileName(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  currentFlashcardId: r.getCurrentFlashcardId(state),
  areFilesLoaded: r.areFilesLoaded(state),
  isNextButtonEnabled: r.isNextButtonEnabled(state),
  isPrevButtonEnabled: r.isPrevButtonEnabled(state),
  loop: r.isLoopOn(state),
  highlightedWaveformSelectionId: r.getHighlightedWaveformSelectionId(state),
  clipsTimes: r.getClipsTimes(state),
})

const mapDispatchToProps = {
  chooseAudioFiles: r.chooseAudioFiles,
  setCurrentFile: r.setCurrentFile,
  setFlashcardField: r.setFlashcardField,
  toggleLoop: r.toggleLoop,
  loadAudio: r.loadAudio,
  deleteCard: r.deleteCard,
  makeClips: r.makeClips,
  highlightSelection: r.highlightSelection,
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
