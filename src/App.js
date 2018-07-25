import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ShowAll from './ShowAll'
import { TextField, Button, Checkbox, FormControlLabel } from '@material-ui/core'

const localFlashcardKey = (file) => `${file.type}_____${file.name}`
const setLocalFlashcard = (flashcard) => {
  const { localStorage } = window
  if (localStorage) {
    const serializedFlashcardData = JSON.stringify({ en: flashcard.en, de: flashcard.de })
    localStorage.setItem(localFlashcardKey(flashcard.file), serializedFlashcardData)
  }
}

const getLocalFlashcard = (file) => {
  const { localStorage } = window
  if (localStorage) {
    const local = localStorage.getItem(localFlashcardKey(file))
    return local ? { ...JSON.parse(local), file } : null
  }
}

const getFlashcards = (files) => {
  const map = {};
  files.forEach(file => {
    const local = getLocalFlashcard(file)
    map[file.name] = local || { de: '', en: '', file }
  })
  return map
}


class App extends Component {
  state = {
    files: [],
    currentFileIndex: 0,
    flashcardsData: {},
    modalIsOpen: false,
    loop: true,
  }

  setFiles = (e) => {
    const files = [...e.target.files]
    this.setState({
      files,
      flashcardsData: getFlashcards(files),
      currentFileIndex: 0,
    }, () => this.germanInput.focus())
    this.playAudio(e.target.files[0])
  }

  triggerFileInputClick = () => {
    this.fileInput.click()
  }

  fileInputRef = (el) => this.fileInput = el
  audioRef = (el) => this.audio = el
  germanInputRef = (el) => this.germanInput = el

  playAudio = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      this.audio.src = e.target.result
      this.audio.play()
    }
    reader.readAsDataURL(file)
  }

  goToFile = (index) => {
    this.setState({ currentFileIndex: index })
    this.playAudio(this.state.files[index])
  }
  prevFile = () => {
    const lower = this.state.currentFileIndex - 1
    this.goToFile(lower >= 0 ? lower : 0)
  }
  nextFile = () => {
    const higher = this.state.currentFileIndex + 1
    const lastIndex = this.state.files.length - 1
    this.goToFile(higher <= lastIndex ? higher : lastIndex)
  }
  handleFlashcardSubmit = (e) => {
    e.preventDefault()
    this.nextFile()
    this.germanInput.focus()
  }

  setFlashcardText = (key, text) => {
    const newFlashcard = {
      ...this.getCurrentFlashcard(),
      [key]: text,
    }
    const flashcardsData = {
      ...this.state.flashcardsData,
      [this.getCurrentFlashcard().file.name]: newFlashcard
    }
    this.setState({ flashcardsData })
    setLocalFlashcard(newFlashcard)
  }

  setGerman = (e) => this.setFlashcardText('de', e.target.value)
  setEnglish = (e) => this.setFlashcardText('en', e.target.value)

  getCurrentFile = () => this.state.files[this.state.currentFileIndex]

  getCurrentFlashcard = () => this.state.flashcardsData[this.getCurrentFile().name]

  getGerman = () => this.getCurrentFlashcard().de
  getEnglish = () => this.getCurrentFlashcard().en

  areFilesLoaded = () => Boolean(this.state.files.length)
  isNextButtonEnabled = () => this.state.currentFileIndex === this.state.files.length - 1
  isPrevButtonEnabled = () => this.state.currentFileIndex === 0
  isModalOpen = () => this.state.modalIsOpen

  openModal = () => this.setState({ modalIsOpen: true })
  closeModal = () => this.setState({ modalIsOpen: false })

  handleAudioEnded = (e) => {
    this.nextFile()
  }
  toggleLoop = () => this.setState({ loop: !this.state.loop })

  render() {
    const form = this.areFilesLoaded()
      ? <form className="form" onSubmit={this.handleFlashcardSubmit}>
        <audio onEnded={this.handleAudioEnded} loop={this.state.loop} ref={this.audioRef} controls className="audioPlayer" autoplay></audio>
        <FormControlLabel
          label="Loop"
          control={
            <Checkbox checked={this.state.loop} value={this.state.loop} onChange={this.toggleLoop} />
          }
        />
        <p className="audioFilenameMenu">
          <Button onClick={this.prevFile} disabled={this.isPrevButtonEnabled()}>Previous</Button>
          <h2 className="audioFileName">
            {this.getCurrentFlashcard().file.name}
          </h2>
          <Button onClick={this.nextFile} disabled={this.isNextButtonEnabled()}>Next</Button>
        </p>
        <div className="formBody">
          <p lang="de">
            <TextField inputRef={this.germanInputRef} onChange={this.setGerman} value={this.getGerman()} fullWidth multiline label="German" /></p>
          <p lang="en">
            <TextField onChange={this.setEnglish} value={this.getEnglish()} fullWidth multiline label="English" />
          </p>
          <Button type="submit" fullWidth onClick={this.submitFlashcardForm} disabled={this.isNextButtonEnabled()}>
            Continue
          </Button>
          <Button fullWidth onClick={this.openModal}>Review &amp; export</Button>
        </div>
      </form>
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
          open={this.isModalOpen()}
          handleClose={this.closeModal}
          flashcardsData={this.state.flashcardsData}
          files={this.state.files}
          currentFileIndex={this.state.currentFileIndex}
          goToFile={this.goToFile}
        />
      </div>
    );
  }
}

export default App;
