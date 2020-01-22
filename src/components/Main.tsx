import React, { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CircularProgress, Tooltip, Fab } from '@material-ui/core'
import { Layers } from '@material-ui/icons'
import { Redirect } from 'react-router-dom'
import Media from '../components/Media'
import Waveform from '../components/Waveform'
import FlashcardSection from '../components/FlashcardSection'
import Header from '../components/MainHeader'
import KeyboardShortcuts from '../components/KeyboardShortcuts'
import DarkTheme from '../components/DarkTheme'
import css from '../components/Main.module.css'
import * as actions from '../actions'
import * as r from '../selectors'

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

  if (!currentProjectId) return <Redirect to="/projects" />

  return (
    <div className={css.container} id={testLabels.container}>
      <DarkTheme>
        <Header
          currentProjectId={currentProjectId}
          currentMediaFile={currentMediaFile}
        />
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
      <FlashcardSection
        showing={Boolean(currentFlashcard)}
        mediaFile={currentMediaFile}
      />
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
