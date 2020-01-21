import React, { Fragment, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, CircularProgress, Tooltip, Fab } from '@material-ui/core'
import {
  Hearing as HearingIcon,
  Delete as DeleteIcon,
  Layers,
} from '@material-ui/icons'
import { Redirect } from 'react-router-dom'
import Media from '../components/Media'
import Waveform from '../components/Waveform'
import FlashcardSection from '../components/FlashcardSection'
import MediaFilesMenu from '../components/MediaFilesMenu'
import KeyboardShortcuts from '../components/KeyboardShortcuts'
import ProjectMenu from '../components/ProjectMenu'
import DarkTheme from '../components/DarkTheme'
import headerCss from '../components/Header.module.css'
import css from '../components/Main.module.css'
import * as r from '../redux'
import * as actions from '../actions'
import SubtitlesMenu from '../components/SubtitlesMenu'

export const testLabels = {
  container: 'main-screen-container',
  exportButton: 'export-button',
} as const

const Main = () => {
  const {
    currentFileName,
    currentFilePath,
    currentFlashcard,
    loop,
    audioIsLoading,
    currentProjectId,
    constantBitrateFilePath,
    currentMediaFile,
    subtitles,
  } = useSelector((state: AppState) => ({
    currentFileName: r.getCurrentFileName(state),
    currentFilePath: r.getCurrentFilePath(state),
    currentFlashcard: r.getCurrentFlashcard(state),
    loop: r.isLoopOn(state),
    audioIsLoading: r.isAudioLoading(state),
    currentProjectId: r.getCurrentProjectId(state),
    constantBitrateFilePath: r.getCurrentMediaConstantBitrateFilePath(state),
    currentMediaFile: r.getCurrentMediaFile(state),
    subtitles: r.getSubtitlesTracks(state),
  }))
  const dispatch = useDispatch()

  const reviewAndExportDialog = useCallback(
    () => dispatch(actions.reviewAndExportDialog()),
    [dispatch]
  )
  const detectSilenceRequest = useCallback(
    () => dispatch(actions.detectSilenceRequest()),
    [dispatch]
  )
  const deleteAllCurrentFileClipsRequest = useCallback(
    () => dispatch(actions.deleteAllCurrentFileClipsRequest()),
    [dispatch]
  )

  if (!currentProjectId) return <Redirect to="/projects" />

  return (
    <div className={css.container} id={testLabels.container}>
      <DarkTheme>
        <header className={headerCss.container}>
          <ProjectMenu className={headerCss.block} />
          <section className={headerCss.block}>
            <MediaFilesMenu
              className={headerCss.leftMenu}
              currentProjectId={currentProjectId}
            />
          </section>
          <ul className={headerCss.rightMenu}>
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

      <section className={css.media}>
        <Media
          key={String(constantBitrateFilePath)}
          constantBitrateFilePath={constantBitrateFilePath}
          loop={loop}
          metadata={currentMediaFile}
          subtitles={subtitles}
        />
      </section>
      {Boolean(currentFileName) && <Waveform show={!audioIsLoading} />}
      {audioIsLoading && (
        <div className={css.waveformPlaceholder}>
          <CircularProgress />
        </div>
      )}
      <FlashcardSection showing={Boolean(currentFlashcard)} />
      {currentFilePath && (
        <Tooltip title="Review and export flashcards">
          <Fab
            id={testLabels.exportButton}
            className={css.floatingActionButton}
            onClick={reviewAndExportDialog}
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

export default Main
