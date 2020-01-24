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

enum $ {
  container = 'main-screen-container',
  exportButton = 'export-button',
}

const Main = () => {
  const {
    currentFlashcard,
    loop,
    audioIsLoading,
    currentProjectId,
    constantBitrateFilePath,
    currentMediaFile,
    clipsIdsForExport,
    subtitles,
  } = useSelector((state: AppState) => {
    const currentMediaFile = r.getCurrentMediaFile(state)
    return {
      currentFlashcard: r.getCurrentFlashcard(state),
      loop: r.isLoopOn(state),
      audioIsLoading: r.isAudioLoading(state),
      currentProjectId: r.getCurrentProjectId(state),
      constantBitrateFilePath: r.getCurrentMediaConstantBitrateFilePath(state),
      currentMediaFile,
      clipsIdsForExport: currentMediaFile
        ? state.clips.idsByMediaFileId[currentMediaFile.id]
        : [],
      subtitles: r.getSubtitlesTracks(state),
    }
  })
  const dispatch = useDispatch()

  const reviewAndExportDialog = useCallback(
    () =>
      dispatch(
        actions.reviewAndExportDialog(currentMediaFile, clipsIdsForExport)
      ),
    [dispatch, currentMediaFile, clipsIdsForExport]
  )

  if (!currentProjectId) return <Redirect to="/projects" />

  return (
    <div className={css.container} id={$.container}>
      <DarkTheme>
        <Header
          currentProjectId={currentProjectId}
          currentMediaFile={currentMediaFile}
        />
      </DarkTheme>

      <section className={css.media}>
        {audioIsLoading ? (
          <div className={css.waveformPlaceholder}>
            <CircularProgress />
          </div>
        ) : (
          <Media
            key={String(constantBitrateFilePath)}
            constantBitrateFilePath={constantBitrateFilePath}
            loop={loop}
            metadata={currentMediaFile}
            subtitles={subtitles}
          />
        )}
      </section>

      {Boolean(currentMediaFile) && <Waveform show={!audioIsLoading} />}
      <FlashcardSection
        showing={Boolean(currentFlashcard)}
        mediaFile={currentMediaFile}
      />

      <Tooltip title="Review and export flashcards">
        <Fab
          id={$.exportButton}
          className={css.floatingActionButton}
          onClick={reviewAndExportDialog}
          color="primary"
        >
          <Layers />
        </Fab>
      </Tooltip>
      <KeyboardShortcuts />
    </div>
  )
}

export default Main

export { $ as main$ }
