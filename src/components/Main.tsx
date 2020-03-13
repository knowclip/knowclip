import React from 'react'
import { useSelector } from 'react-redux'
import { CircularProgress } from '@material-ui/core'
import { Redirect } from 'react-router-dom'
import cn from 'classnames'
import Media from '../components/Media'
import Waveform from '../components/Waveform'
import FlashcardSection from '../components/FlashcardSection'
import Header from '../components/MainHeader'
import KeyboardShortcuts from '../components/KeyboardShortcuts'
import DarkTheme from '../components/DarkTheme'
import css from '../components/Main.module.css'
import * as r from '../selectors'

enum $ {
  container = 'main-screen-container',
}

const Main = () => {
  const {
    loop,
    audioIsLoading,
    currentProject,
    constantBitrateFilePath,
    currentMediaFile,
    subtitles,
    viewMode,
  } = useSelector((state: AppState) => {
    const currentMediaFile = r.getCurrentMediaFile(state)
    return {
      loop: r.isLoopOn(state),
      audioIsLoading: r.isAudioLoading(state),
      currentProject: r.getCurrentProject(state),
      constantBitrateFilePath: r.getCurrentMediaConstantBitrateFilePath(state),
      currentMediaFile,
      clipsIdsForExport: currentMediaFile
        ? state.clips.idsByMediaFileId[currentMediaFile.id]
        : EMPTY,
      subtitles: r.getSubtitlesFilesWithTracks(state),
      viewMode: state.settings.viewMode,
    }
  })

  if (!currentProject) return <Redirect to="/projects" />

  return (
    <div className={css.container} id={$.container}>
      <DarkTheme>
        <Header
          currentProjectId={currentProject.id}
          currentMediaFile={currentMediaFile}
        />
      </DarkTheme>

      <section
        className={cn(css.middle, {
          [css.horizontal]: viewMode === 'HORIZONTAL',
        })}
      >
        {audioIsLoading ? (
          <div className={css.media} style={{ alignItems: 'center' }}>
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
            viewMode={viewMode}
          />
        )}

        <FlashcardSection
          mediaFile={currentMediaFile}
          className={css.flashcardSection}
          projectFile={currentProject}
        />
      </section>

      <Waveform show={Boolean(currentMediaFile && !audioIsLoading)} />

      <KeyboardShortcuts />
    </div>
  )
}

const EMPTY: string[] = []

export default Main

export { $ as main$ }
