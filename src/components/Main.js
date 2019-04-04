import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  IconButton,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  Fab,
} from '@material-ui/core'
import {
  Hearing as HearingIcon,
  Delete as DeleteIcon,
  Layers,
} from '@material-ui/icons'
import { Redirect } from 'react-router-dom'
import Waveform from '../components/Waveform'
import FlashcardForm from '../components/FlashcardForm'
import MediaFilesNavMenu from '../components/MediaFilesNavMenu'
import ProjectMenu from '../components/ProjectMenu'
import DarkTheme from '../components/DarkTheme'
import headerCss from '../components/Header.module.css'
import flashcardFormCss from '../components/FlashcardForm.module.css'
import truncate from '../utils/truncate'
import * as r from '../redux'

const Media = ({ filePath, loop, audioRef, handleAudioEnded, metadata }) => {
  const props = {
    onEnded: handleAudioEnded,
    loop: loop,
    ref: audioRef,
    controls: true,
    id: 'audioPlayer',
    className: 'audioPlayer',
    controlsList: 'nodownload',
    // autoPlay: true,
    src: filePath ? `file:///${filePath}` : null,
  }

  return metadata && metadata.isVideo ? (
    <video {...props} />
  ) : (
    <audio {...props} />
  )
}

class Main extends Component {
  state = {
    modalIsOpen: false,
    noteTypeClipMenuAnchor: null,
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

  render() {
    if (!this.props.currentProjectId) return <Redirect to="/projects" />

    const {
      loop,
      currentFlashcard,
      currentFileName,
      currentFilePath,
      audioIsLoading,
      mediaFolderLocation,
      detectSilenceRequest,
      deleteAllCurrentFileClipsRequest,
      clipsHaveBeenMade,
      constantBitrateFilePath,
      currentMediaMetadata,
    } = this.props

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
          You can add and remove fields in the flashcard template form.
        </CardContent>
      </Card>
    )

    return (
      <div className="App">
        <DarkTheme>
          <header className={headerCss.container}>
            <section className={headerCss.block}>
              <ProjectMenu />
              <MediaFilesNavMenu className={headerCss.leftMenu} />
            </section>
            <ul className={headerCss.rightMenu}>
              {mediaFolderLocation ? (
                <li className={headerCss.menuTextItem}>
                  audio will be saved in:{' '}
                  <a
                    href="/#"
                    onClick={this.openMediaFolderLocationFormDialog}
                    title={mediaFolderLocation}
                  >
                    {truncate(mediaFolderLocation, 30)}
                  </a>
                </li>
              ) : (
                <li className={headerCss.menuTextItem}>
                  <a href="/#" onClick={this.openMediaFolderLocationFormDialog}>
                    choose media folder location
                  </a>
                </li>
              )}
              {/* <li className={headerCss.menuTextItem}>
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
                </Menu>
              </li> */}
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
            filePath={constantBitrateFilePath}
            onEnded={this.handleAudioEnded}
            loop={loop}
            metadata={currentMediaMetadata}
          />
        </section>
        {Boolean(currentFileName) && <Waveform show={!audioIsLoading} />}
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
  currentFileName: r.getCurrentFileName(state),
  currentFilePath: r.getCurrentFilePath(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  selectedClipId: r.getSelectedClipId(state),
  loop: r.isLoopOn(state),
  highlightedClipId: r.getHighlightedClipId(state),
  audioIsLoading: r.isAudioLoading(state),
  clipsHaveBeenMade: r.haveClipsBeenMade(state),
  mediaFolderLocation: r.getMediaFolderLocation(state),
  currentProjectId: r.getCurrentProjectId(state),
  constantBitrateFilePath: r.getConstantBitrateFilePath(state),
  currentMediaMetadata: r.getCurrentMediaMetadata(state),
})

const mapDispatchToProps = {
  chooseMediaFiles: r.chooseMediaFiles,
  setCurrentFile: r.setCurrentFile,
  setFlashcardField: r.setFlashcardField,
  toggleLoop: r.toggleLoop,
  makeClips: r.makeClips,
  exportFlashcards: r.exportFlashcards,
  highlightClip: r.highlightClip,
  initializeApp: r.initializeApp,
  detectSilenceRequest: r.detectSilenceRequest,
  deleteAllCurrentFileClipsRequest: r.deleteAllCurrentFileClipsRequest,
  mediaFolderLocationFormDialog: r.mediaFolderLocationFormDialog,
  reviewAndExportDialog: r.reviewAndExportDialog,
  confirmationDialog: r.confirmationDialog,
  addMediaToProjectRequest: r.addMediaToProjectRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main)
