import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  IconButton,
  CircularProgress,
  Tooltip,
  Menu,
  Card,
  CardContent,
  Fab,
} from '@material-ui/core'
import {
  Hearing as HearingIcon,
  Delete as DeleteIcon,
  Layers,
} from '@material-ui/icons'
import Waveform from '../components/Waveform'
import FlashcardForm from '../components/FlashcardForm'
import AudioFilesNavMenu from '../components/AudioFilesNavMenu'
import NoteTypeSelectionMenu from '../components/NoteTypeSelectionMenu'
import DarkTheme from '../components/DarkTheme'
import { extname } from 'path'
import headerCss from '../components/Header.module.css'
import flashcardFormCss from '../components/FlashcardForm.module.css'
import uuid from 'uuid/v4'

import * as r from '../redux'
import electron from 'electron'

const { remote } = electron
const { dialog } = remote

const VIDEO_EXTENSIONS = `.MP4 .AVI .MOV .FLV .WMV`.split(/\s/)
const isVideo = filePath =>
  VIDEO_EXTENSIONS.includes(extname(filePath).toUpperCase())

const Media = ({ filePath, loop, audioRef, handleAudioEnded }) => {
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
    noteTypeClipMenuAnchor: null,
  }

  componentDidMount() {
    this.props.initializeApp()
  }

  chooseAudioFiles = () => {
    dialog.showOpenDialog(
      // { properties: ['openFile', 'multiClips'] },
      { properties: ['openFile'] },
      filePaths => {
        if (filePaths) {
          const ids = filePaths.map(filePath => uuid())
          this.props.chooseAudioFiles(
            filePaths,
            ids,
            this.props.defaultNoteTypeId
          )
        }
      }
    )
  }

  removeAudioFiles = () =>
    this.props.confirmationDialog(
      'Are you sure you want to close this media file?',
      r.removeAudioFiles()
    )

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
    const { deleteCard, highlightedClipId } = this.props
    if (highlightedClipId) {
      deleteCard(highlightedClipId)
    }
  }

  reviewAndExportDialog = () => this.props.reviewAndExportDialog()

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
    this.setState({ noteTypeClipMenuAnchor: e.currentTarget })
  }
  closeNoteTypeSelectionMenu = () =>
    this.setState({ noteTypeClipMenuAnchor: null })

  toggleLoop = () => this.props.toggleLoop()

  render() {
    const {
      loop,
      isPrevButtonEnabled,
      isNextButtonEnabled,
      currentFlashcard,
      currentFileName,
      currentFilePath,
      audioIsLoading,
      mediaFolderLocation,
      detectSilenceRequest,
      deleteAllCurrentFileClipsRequest,
      currentNoteType,
      clipsHaveBeenMade,
    } = this.props
    const { noteTypeClipMenuAnchor } = this.state

    const form = Boolean(currentFlashcard) ? (
      <FlashcardForm />
    ) : (
      <Card className={flashcardFormCss.container}>
        <CardContent>
          {clipsHaveBeenMade ? (
            <p className="introText">No clip selected</p>
          ) : (
            <p className="introText">
              <strong>Click and drag</strong> on the waveform to select clips
              from your media file to turn into flashcards.
            </p>
          )}
        </CardContent>
      </Card>
    )

    return (
      <div className="App">
        <DarkTheme>
          <header className={headerCss.container}>
            <AudioFilesNavMenu
              className={headerCss.leftMenu}
              onClickPrevious={this.prevFile}
              onClickNext={this.nextFile}
              onClickLoop={this.toggleLoop}
              currentFilename={currentFileName}
              isPrevButtonEnabled={isPrevButtonEnabled}
              isNextButtonEnabled={isNextButtonEnabled}
              chooseAudioFiles={this.chooseAudioFiles}
              removeAudioFiles={this.removeAudioFiles}
              loop={loop}
            />
            <ul className={headerCss.rightMenu}>
              {mediaFolderLocation ? (
                <li className={headerCss.menuTextItem}>
                  audio will be saved in:{' '}
                  <a href="/#" onClick={this.openMediaFolderLocationFormDialog}>
                    {mediaFolderLocation}
                  </a>
                </li>
              ) : (
                <li className={headerCss.menuTextItem}>
                  <a href="/#" onClick={this.openMediaFolderLocationFormDialog}>
                    choose media folder location
                  </a>
                </li>
              )}
              <li className={headerCss.menuTextItem}>
                using note type:{' '}
                <a
                  ref={noteTypeClipMenuAnchor}
                  href="/#"
                  onClick={this.openNoteTypeSelectionMenu}
                >
                  {currentNoteType.name}
                </a>
                <Menu
                  anchorEl={noteTypeClipMenuAnchor}
                  onClose={this.closeNoteTypeSelectionMenu}
                  open={Boolean(noteTypeClipMenuAnchor)}
                >
                  <NoteTypeSelectionMenu />
                </Menu>
              </li>
              <li className={headerCss.menuItem}>
                <Tooltip title="Detect silences">
                  <IconButton onClick={detectSilenceRequest}>
                    <HearingIcon />
                  </IconButton>
                </Tooltip>
              </li>
              <li className={headerCss.menuItem}>
                <Tooltip title="Delete all clips for this file">
                  <IconButton onClick={deleteAllCurrentFileClipsRequest}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </li>
            </ul>
          </header>
        </DarkTheme>

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
        {form}
        {currentFilePath && (
          <Tooltip title="Review and export flashcards">
            <Fab
              className="floatingActionButton"
              onClick={this.reviewAndExportDialog}
              color="primary"
            >
              <Layers />
            </Fab>
          </Tooltip>
        )}
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
  selectedClipId: r.getSelectedClipId(state),
  isNextButtonEnabled: r.isNextButtonEnabled(state),
  isPrevButtonEnabled: r.isPrevButtonEnabled(state),
  loop: r.isLoopOn(state),
  highlightedClipId: r.getHighlightedClipId(state),
  clipsTimes: r.getClipsTimes(state),
  audioIsLoading: r.isAudioLoading(state),
  mediaFolderLocation: r.getMediaFolderLocation(state),
  currentNoteType: r.getCurrentNoteType(state),
  defaultNoteTypeId: r.getDefaultNoteTypeId(state),
  clipsHaveBeenMade: r.haveClipsBeenMade(state),
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
  highlightClip: r.highlightClip,
  initializeApp: r.initializeApp,
  detectSilenceRequest: r.detectSilenceRequest,
  deleteAllCurrentFileClipsRequest: r.deleteAllCurrentFileClipsRequest,
  mediaFolderLocationFormDialog: r.mediaFolderLocationFormDialog,
  reviewAndExportDialog: r.reviewAndExportDialog,
  confirmationDialog: r.confirmationDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
