import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Menu,
} from '@material-ui/core'
import {
  Hearing as HearingIcon,
  Delete as DeleteIcon,
} from '@material-ui/icons'
import ShowAll from '../components/ShowAll'
import Waveform from '../components/Waveform'
import FlashcardForm from '../components/FlashcardForm'
import AudioFilesNavMenu from '../components/AudioFilesNavMenu'
import NoteTypeSelectionMenu from '../components/NoteTypeSelectionMenu'
import { extname } from 'path'
import headerCss from '../components/Header.module.css'

import * as r from '../redux'
import electron from 'electron'

const { remote } = electron
const { dialog } = remote

const VIDEO_EXTENSIONS = `.MP4 .AVI .MOV .FLV .WMV`.split(/\s/)
const isVideo = filePath =>
  VIDEO_EXTENSIONS.includes(extname(filePath).toUpperCase())

const Media = ({ filePath, loop, audioRef, handleAudioEnded }) => {
  // if (!filePath) return null
  const props = {
    onEnded: handleAudioEnded,
    loop: loop,
    ref: audioRef,
    controls: true,
    id: 'audioPlayer',
    className: 'audioPlayer',
    controlsList: 'nodownload',
    autoPlay: true,
  }

  return filePath && isVideo(filePath) ? (
    <video {...props} />
  ) : (
    <audio {...props} />
  )
}

class App extends Component {
  state = {
    modalIsOpen: false,
    noteTypeSelectionMenuAnchor: null,
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

          this.props.chooseAudioFiles(filePaths, this.props.defaultNoteTypeId)
        })
      }
    )
  }

  removeAudioFiles = () => this.props.removeAudioFiles()

  audioRef = el => (this.audio = el)
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

  openMediaFolderLocationFormDialog = e => {
    e.preventDefault()
    this.props.mediaFolderLocationFormDialog()
  }

  openNoteTypeSelectionMenu = e => {
    e.preventDefault()
    this.setState({ noteTypeSelectionMenuAnchor: e.currentTarget })
  }
  closeNoteTypeSelectionMenu = () =>
    this.setState({ noteTypeSelectionMenuAnchor: null })

  render() {
    const {
      loop,
      isPrevButtonEnabled,
      isNextButtonEnabled,
      currentFlashcard,
      currentFileIndex,
      flashcards,
      currentFileName,
      currentFilePath,
      makeClips,
      exportFlashcards,
      highlightSelection,
      audioIsLoading,
      mediaFolderLocation,
      detectSilenceRequest,
      deleteAllCurrentFileClipsRequest,
      currentNoteType,
    } = this.props
    const { noteTypeSelectionMenuAnchor } = this.state

    const form = Boolean(currentFlashcard) ? (
      <FlashcardForm />
    ) : (
      <p>Click + drag to make audio clips and start making flashcards.</p>
    )

    return (
      <div className="App">
        <header className={headerCss.container}>
          <ul className={headerCss.menu}>
            {mediaFolderLocation ? (
              <li className={headerCss.menuItem}>
                audio will be saved in:{' '}
                <a href="/#" onClick={this.openMediaFolderLocationFormDialog}>
                  {mediaFolderLocation}
                </a>
              </li>
            ) : (
              <li className={headerCss.menuItem}>
                <a href="/#" onClick={this.openMediaFolderLocationFormDialog}>
                  choose media folder location
                </a>
              </li>
            )}
            <li className={headerCss.menuItem}>
              using note type:{' '}
              <a
                ref={noteTypeSelectionMenuAnchor}
                href="/#"
                onClick={this.openNoteTypeSelectionMenu}
              >
                {currentNoteType.name}
              </a>
              <Menu
                anchorEl={noteTypeSelectionMenuAnchor}
                onClose={this.closeNoteTypeSelectionMenu}
                open={noteTypeSelectionMenuAnchor}
              >
                <NoteTypeSelectionMenu />
              </Menu>
            </li>
          </ul>
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
        <section className="media">
          <Media
            filePath={currentFilePath}
            onEnded={this.handleAudioEnded}
            ref={this.audioRef}
            loop={loop}
          />
        </section>
        <Waveform show={!audioIsLoading} svgRef={this.svgRef} />
        {audioIsLoading && (
          <div className="waveform-placeholder">
            <CircularProgress />
          </div>
        )}
        <p>
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
        <Button fullWidth onClick={this.openModal}>
          Review &amp; export
        </Button>
        <ShowAll
          open={this.state.modalIsOpen}
          handleClose={this.closeModal}
          flashcards={flashcards}
          files={null /* this.state.files */}
          currentFileIndex={currentFileIndex}
          highlightSelection={highlightSelection}
          makeClips={makeClips}
          exportFlashcards={exportFlashcards}
          currentNoteType={currentNoteType}
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
  currentFilePath: r.getCurrentFilePath(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  currentFlashcardId: r.getCurrentFlashcardId(state),
  isNextButtonEnabled: r.isNextButtonEnabled(state),
  isPrevButtonEnabled: r.isPrevButtonEnabled(state),
  loop: r.isLoopOn(state),
  highlightedWaveformSelectionId: r.getHighlightedWaveformSelectionId(state),
  clipsTimes: r.getClipsTimes(state),
  audioIsLoading: r.isAudioLoading(state),
  mediaFolderLocation: r.getMediaFolderLocation(state),
  currentNoteType: r.getCurrentNoteType(state),
  defaultNoteTypeId: r.getDefaultNoteTypeId(state),
})

const mapDispatchToProps = {
  chooseAudioFiles: r.chooseAudioFiles,
  removeAudioFiles: r.removeAudioFiles,
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
  mediaFolderLocationFormDialog: r.mediaFolderLocationFormDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
