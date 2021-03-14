import React from 'react'
import { useEffect, useRef } from 'react'
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
import waveformCss from '../components/Waveform.module.css'
import * as r from '../selectors'
import { setMousePosition } from '../utils/mousePosition'
import { useWaveformState } from './useWaveformState'
import { useWaveformMediaTimeUpdate } from './useWaveformMediaTimeUpdate'

enum $ {
  container = 'main-screen-container',
}

const Main = () => {
  const {
    loop,
    mediaIsEffectivelyLoading,
    currentProject,
    constantBitrateFilePath,
    currentMediaFile,
    subtitles,
    viewMode,
    waveformItems,
  } = useSelector((state: AppState) => {
    const currentMediaFile = r.getCurrentMediaFile(state)
    return {
      loop: r.getLoopState(state),
      mediaIsEffectivelyLoading: r.isMediaEffectivelyLoading(state),
      currentProject: r.getCurrentProject(state),
      constantBitrateFilePath: r.getCurrentMediaConstantBitrateFilePath(state),
      currentMediaFile,
      clipsIdsForExport: currentMediaFile
        ? state.clips.idsByMediaFileId[currentMediaFile.id]
        : EMPTY,
      subtitles: r.getSubtitlesFilesWithTracks(state),
      viewMode: state.settings.viewMode,
      waveformItems: r.getWaveformItems(state),
    }
  })

  useEffect(() => {
    const trackCursor = (e: MouseEvent) => {
      setMousePosition([e.clientX, e.clientY])
    }
    document.addEventListener('mousemove', trackCursor)
    return () => document.removeEventListener('mousemove', trackCursor)
  }, [])

  const playerRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)
  const waveform = useWaveformState(waveformItems)
  const { svgRef, resetWaveformState } = waveform
  const { onTimeUpdate } = useWaveformMediaTimeUpdate(svgRef, waveform)

  if (!currentProject) return <Redirect to="/projects" />

  return (
    <div className={css.container} id={$.container}>
      <DarkTheme>
        <Header
          currentProjectId={currentProject.id}
          currentMediaFile={currentMediaFile}
          waveform={waveform}
        />
      </DarkTheme>

      <section
        className={cn(css.middle, {
          [css.horizontal]: viewMode === 'HORIZONTAL',
        })}
      >
        {mediaIsEffectivelyLoading ? (
          <div
            className={css.media}
            style={{ alignItems: 'center', margin: '2rem' }}
          >
            <CircularProgress variant="indeterminate" />
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
            playerRef={playerRef}
            onMediaLoaded={resetWaveformState}
            onTimeUpdate={onTimeUpdate}
          />
        )}

        <FlashcardSection
          mediaFile={currentMediaFile}
          className={css.flashcardSection}
          projectFile={currentProject}
        />
      </section>

      {currentMediaFile && !mediaIsEffectivelyLoading ? (
        <Waveform
          waveformState={waveform}
          playerRef={playerRef}
          key={currentMediaFile.id}
        />
      ) : (
        <div className={waveformCss.waveformPlaceholder} />
      )}

      <KeyboardShortcuts />
    </div>
  )
}

const EMPTY: string[] = []

export default Main

export { $ as main$ }
