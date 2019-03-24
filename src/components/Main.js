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
import { Redirect } from 'react-router-dom'
import Waveform from '../components/Waveform'
import FlashcardForm from '../components/FlashcardForm'
import AudioFilesNavMenu from '../components/AudioFilesNavMenu'
import ProjectMenu from '../components/ProjectMenu'
// import NoteTypeSelectionMenu from '../components/NoteTypeSelectionMenu'
import DarkTheme from '../components/DarkTheme'
import { extname } from 'path'
import headerCss from '../components/Header.module.css'
import flashcardFormCss from '../components/FlashcardForm.module.css'
import truncate from '../utils/truncate'
import * as r from '../redux'

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
    src: filePath ? `file:///${filePath}` : null,
  }

  return filePath && isVideo(filePath) ? (
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

  // chooseAudioFiles = async () => {
  //   const filePaths = await showOpenDialog(
  //     [{ name: 'Audio or video files' }],
  //     true
  //   )
  //   const { addMediaToProjectRequest, currentProjectId } = this.props
  //   if (filePaths) addMediaToProjectRequest(currentProjectId, filePaths)
  // }

  audioRef = el => (this.audio = el)
  svgRef = el => (this.svg = el)

  reviewAndExportDialog = () => this.props.reviewAndExportDialog()

  handleAudioEnded = e => {
    this.nextFile()
  }
  toggleLoop = () => this.props.toggleLoop()

  openMediaFolderLocationFormDialog = e => {
    e.preventDefault()
    this.props.mediaFolderLocationFormDialog()
  }

  // openNoteTypeSelectionMenu = e => {
  //   e.preventDefault()
  //   this.setState({ noteTypeClipMenuAnchor: e.currentTarget })
  // }
  // closeNoteTypeSelectionMenu = () =>
  //   this.setState({ noteTypeClipMenuAnchor: null })

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
      // currentNoteType,
      clipsHaveBeenMade,
      constantBitrateFilePath,
    } = this.props
    // const { noteTypeClipMenuAnchor } = this.state

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
              <AudioFilesNavMenu className={headerCss.leftMenu} />
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
            ref={this.audioRef}
            loop={loop}
          />
        </section>
        {Boolean(currentFileName) && (
          <Waveform show={!audioIsLoading} svgRef={this.svgRef} />
        )}
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
  // filePaths: r.getFilePaths(state),
  flashcards: [], //r.getFlashcardsByTime(state),
  // currentFileIndex: r.getCurrentFileIndex(state),
  currentFileName: r.getCurrentFileName(state),
  currentFilePath: r.getCurrentFilePath(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  selectedClipId: r.getSelectedClipId(state),
  loop: r.isLoopOn(state),
  highlightedClipId: r.getHighlightedClipId(state),
  clipsTimes: [], // r.getClipsTimes(state),
  audioIsLoading: r.isAudioLoading(state),
  mediaFolderLocation: r.getMediaFolderLocation(state),
  // currentNoteType: r.getCurrentNoteType(state),
  // defaultNoteTypeId: r.getDefaultNoteTypeId(state),
  clipsHaveBeenMade: r.haveClipsBeenMade(state),
  currentProjectId: r.getCurrentProjectId(state),
  constantBitrateFilePath: r.getConstantBitrateFilePath(state),
})

const mapDispatchToProps = {
  chooseAudioFiles: r.chooseAudioFiles,
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
