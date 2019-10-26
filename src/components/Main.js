import React, { Component, Fragment, useEffect } from 'react'
import { connect } from 'react-redux'
import { IconButton, CircularProgress, Tooltip, Fab } from '@material-ui/core'
import {
  Hearing as HearingIcon,
  Delete as DeleteIcon,
  Layers,
} from '@material-ui/icons'
import { Redirect } from 'react-router-dom'
import Waveform from '../components/Waveform'
import FlashcardSection from '../components/FlashcardSection'
import MediaFilesNavMenu from '../components/MediaFilesNavMenu'
import KeyboardShortcuts from '../components/KeyboardShortcuts'
import ProjectMenu from '../components/ProjectMenu'
import DarkTheme from '../components/DarkTheme'
import headerCss from '../components/Header.module.css'
import * as r from '../redux'
import SubtitlesMenu from '../components/SubtitlesMenu.js'

const Subtitles = ({ track }) =>
  track.type === 'EmbeddedSubtitlesTrack' ? (
    <track
      kind="subtitles"
      src={`file://${track.tmpFilePath}`}
      mode={track.mode}
      default={track.mode === 'showing'}
    />
  ) : (
    <track
      kind="subtitles"
      src={`file://${track.vttFilePath}`}
      mode={track.mode}
      default={track.mode === 'showing'}
    />
  )

const Media = ({
  filePath,
  loop,
  audioRef,
  handleAudioEnded,
  metadata,
  subtitles,
}) => {
  const props = {
    onEnded: handleAudioEnded,
    loop: loop,
    ref: audioRef,
    controls: true,
    disablePictureInPicture: true,
    id: 'audioPlayer',
    className: 'audioPlayer',
    controlsList: 'nodownload nofullscreen',
    src: filePath ? `file://${filePath}` : null,
    playbackspeed: 1,
  }
  useEffect(
    () => {
      if (props.src) {
        setTimeout(() => {
          document.getElementById('audioPlayer').src = props.src
        }, 0)
      }
    },
    [props.src]
  )

  return metadata && metadata.isVideo ? (
    <div className="videoContainer">
      <video {...props}>
        {subtitles.map(track =>
          track.mode === 'showing' ? (
            <Subtitles track={track} key={track.id} />
          ) : null
        )}
      </video>
    </div>
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

  render() {
    if (!this.props.currentProjectId) return <Redirect to="/projects" />

    const {
      loop,
      currentFlashcard,
      currentFileName,
      currentFilePath,
      audioIsLoading,
      detectSilenceRequest,
      deleteAllCurrentFileClipsRequest,
      constantBitrateFilePath,
      currentMediaFile,
      subtitles,
    } = this.props

    return (
      <div className="App">
        <DarkTheme>
          <header className={headerCss.container}>
            <ProjectMenu className={headerCss.block} />
            <section className={headerCss.block}>
              <MediaFilesNavMenu className={headerCss.leftMenu} />
            </section>
            <ul className={headerCss.rightMenu}>
              {' '}
              {currentMediaFile && (
                <Fragment>
                  <li className={headerCss.menuItem}>
                    <SubtitlesMenu />
                  </li>
                  <li className={headerCss.menuItem}>
                    <Tooltip title="Detect silences">
                      <IconButton onClick={detectSilenceRequest}>
                        <HearingIcon />
                      </IconButton>
                    </Tooltip>
                  </li>
                  <li className={headerCss.menuItem}>
                    <Tooltip title="Delete all clips for this media">
                      <IconButton onClick={deleteAllCurrentFileClipsRequest}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </li>
                </Fragment>
              )}
            </ul>
          </header>
        </DarkTheme>

        <section className="media">
          <Media
            key={String(constantBitrateFilePath)}
            filePath={constantBitrateFilePath}
            onEnded={this.handleAudioEnded}
            loop={loop}
            metadata={currentMediaFile}
            subtitles={subtitles}
          />
        </section>
        {Boolean(currentFileName) && <Waveform show={!audioIsLoading} />}
        {audioIsLoading && (
          <div className="waveform-placeholder">
            <CircularProgress />
          </div>
        )}
        <FlashcardSection showing={Boolean(currentFlashcard)} />
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
        <KeyboardShortcuts />
      </div>
    )
  }
}

const mapStateToProps = state => ({
  currentFileName: r.getCurrentFileName(state),
  currentFilePath: r.getCurrentFilePath(state),
  currentFlashcard: r.getCurrentFlashcard(state),
  loop: r.isLoopOn(state),
  audioIsLoading: r.isAudioLoading(state),
  currentProjectId: r.getCurrentProjectId(state),
  constantBitrateFilePath: r.getCurrentMediaFileConstantBitratePath(state),
  currentMediaFile: r.getCurrentMediaFileRecord(state),
  subtitles: r.getSubtitlesTracks(state),
})

const mapDispatchToProps = {
  toggleLoop: r.toggleLoop,
  detectSilenceRequest: r.detectSilenceRequest,
  deleteAllCurrentFileClipsRequest: r.deleteAllCurrentFileClipsRequest,
  reviewAndExportDialog: r.reviewAndExportDialog,
  confirmationDialog: r.confirmationDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main)
