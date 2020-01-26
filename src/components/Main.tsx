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

      <section className={css.middle}>
        {audioIsLoading ? (
          <div>
            <CircularProgress />
          </div>
        ) : (
          <Media
            key={String(constantBitrateFilePath)}
            className={css.media}
            constantBitrateFilePath={constantBitrateFilePath}
            loop={loop}
            metadata={currentMediaFile}
            subtitles={subtitles}
          />
        )}

        <FlashcardSection
          mediaFile={currentMediaFile}
          className={css.flashcardSection}
        />
      </section>

      <Waveform show={Boolean(currentMediaFile && !audioIsLoading)} />

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
