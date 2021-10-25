import React, { useCallback, useMemo } from 'react'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CircularProgress } from '@material-ui/core'
import { Redirect } from 'react-router-dom'
import cn from 'classnames'
import Media from '../components/Media'
import {
  Waveform,
  useWaveform,
  WaveformItem,
  sortWaveformItems,
  usePlayButtonSync,
  WAVEFORM_HEIGHT,
  SUBTITLES_CHUNK_HEIGHT,
} from 'clipwave'
import FlashcardSection from '../components/FlashcardSection'
import Header from '../components/MainHeader'
import KeyboardShortcuts from '../components/KeyboardShortcuts'
import DarkTheme from '../components/DarkTheme'
import css from '../components/Main.module.css'
import waveformCss from '../components/Waveform.module.css'
import * as r from '../selectors'
import { actions } from '../actions'
import { setMousePosition } from '../utils/mousePosition'
import 'clipwave/dist/index.css'
import { SubtitlesCardBase } from '../selectors'
import { usePrevious } from '../utils/usePrevious'
import { useRenderSecondaryClip } from './waveformRenderSubtitlesChunks'
import { waveform$ } from './waveformTestLabels'
import { useWaveformRenderClip } from './useWaveformRenderClip'
import { getFreshRegions } from '../epics/getFreshRegions'
import { isWaveformItemSelectable } from '../utils/clipwave/isWaveformItemSelectable'
import { useWaveformEventHandlers } from '../utils/clipwave/useWaveformEventHandlers'

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
    clipsMap,
    waveformImages,
    subsBases,
    editing,
    currentFileClipsOrder,
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
      waveformImages: r.getWaveformImages(state),
      clipsMap: r.getClipsObject(state),
      currentFileClipsOrder: r.getCurrentFileClipsOrder(state),
      subsBases: r.getSubtitlesCardBases(state),
      editing: r.isUserEditingCards(state),
    }
  })

  const waveformImagesWithUrls = useMemo(() => {
    return waveformImages.map(
      ({ file: { startSeconds, endSeconds }, path }) => ({
        url: new URL(`file://${path}`).toString(),
        startSeconds,
        endSeconds,
      })
    )
  }, [waveformImages])

  const mediaFileId = currentMediaFile?.id

  const getWaveformItem = useCallback(
    (id: string): WaveformItem | null => {
      const clip: Clip | null = clipsMap[id] || null
      if (clip && clip.fileId === mediaFileId) return clip

      const subsBase: SubtitlesCardBase | null = subsBases.cardsMap[id]
      if (subsBase) return subsBase

      return null
    },
    [clipsMap, subsBases, mediaFileId]
  )

  useEffect(() => {
    const trackCursor = (e: MouseEvent) => {
      setMousePosition([e.clientX, e.clientY])
    }
    document.addEventListener('mousemove', trackCursor)
    return () => document.removeEventListener('mousemove', trackCursor)
  }, [])

  const playerRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)
  const waveform = useWaveform(getWaveformItem)
  const { onTimeUpdate } = waveform
  const { resetWaveformState } = waveform.actions

  const prevMediaFileId = usePrevious(mediaFileId)
  useEffect(() => {
    if (mediaFileId !== prevMediaFileId) {
      resetWaveformState(
        playerRef.current,
        sortWaveformItems([
          ...currentFileClipsOrder.map((id) => clipsMap[id]),
          ...subsBases.cards,
        ])
      )
    }
  }, [
    clipsMap,
    currentFileClipsOrder,
    mediaFileId,
    prevMediaFileId,
    resetWaveformState,
    subsBases.cards,
  ])

  const handleMediaLoaded = useCallback(
    (player: HTMLVideoElement | HTMLAudioElement | null) => {
      resetWaveformState(
        player,
        sortWaveformItems([
          ...currentFileClipsOrder.map((id) => clipsMap[id]),
          ...subsBases.cards,
        ])
      )
    },
    [clipsMap, currentFileClipsOrder, resetWaveformState, subsBases.cards]
  )
  usePlayButtonSync(waveform.state.pixelsPerSecond, playerRef)

  const previousSelection = usePrevious(waveform.state.selection)

  const selection = waveform.getSelection()

  const prevSubsBases = usePrevious(subsBases)
  useEffect(() => {
    if (subsBases !== prevSubsBases) {
      const { regions, newSelection } = getFreshRegions(
        currentFileClipsOrder,
        clipsMap,
        subsBases,
        waveform,
        playerRef.current
      )
      waveform.dispatch({
        type: 'SET_REGIONS',
        regions,
        newSelectionRegion: newSelection.regionIndex,
        newSelectionItemId: newSelection.item || undefined,
      })
    }
  }, [
    prevSubsBases,
    subsBases,
    currentFileClipsOrder,
    clipsMap,
    waveform,
    playerRef,
  ])

  const dispatch = useDispatch()

  const { highlightedClipId } = useSelector((state: AppState) => {
    return {
      highlightedClipId: r.getHighlightedClipId(state),
    }
  })

  useEffect(() => {
    if (selection.selection.item !== previousSelection?.item) {
      const newSelection = selection.item
        ? {
            type:
              selection.item.clipwaveType === 'Primary'
                ? ('Clip' as const)
                : ('Preview' as const),
            id: selection.item.id,
          }
        : null

      if (!newSelection && editing) {
        dispatch(actions.stopEditingCards())
      }

      dispatch(actions.selectWaveformItem(newSelection))
    }
  }, [dispatch, editing, previousSelection, selection])

  const { selectPreviousItemAndSeek, selectNextItemAndSeek } = waveform.actions
  const selectPreviousCard = useCallback(() => {
    selectPreviousItemAndSeek(playerRef.current, isWaveformItemSelectable)
  }, [selectPreviousItemAndSeek])
  const selectNextCard = useCallback(() => {
    selectNextItemAndSeek(playerRef.current, isWaveformItemSelectable)
  }, [selectNextItemAndSeek])

  const { handleWaveformDrag, handleClipDrag, handleClipEdgeDrag } =
    useWaveformEventHandlers({
      playerRef,
      dispatch,
      waveform,
      highlightedClipId,
    })

  const renderPrimaryClip = useWaveformRenderClip()
  const renderSecondaryClip = useRenderSecondaryClip(waveform)

  if (!currentProject) return <Redirect to="/projects" />

  return (
    <div className={css.container} id={$.container}>
      <DarkTheme>
        <Header
          currentProjectId={currentProject.id}
          currentMediaFile={currentMediaFile}
          waveform={waveform}
          playerRef={playerRef}
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
            onMediaLoaded={handleMediaLoaded}
            onTimeUpdate={onTimeUpdate}
          />
        )}

        <FlashcardSection
          mediaFile={currentMediaFile}
          className={css.flashcardSection}
          projectFile={currentProject}
          selectPrevious={selectPreviousCard}
          selectNext={selectNextCard}
        />
      </section>

      {currentMediaFile && !mediaIsEffectivelyLoading ? (
        <Waveform
          waveform={waveform}
          playerRef={playerRef}
          key={currentMediaFile.id}
          images={waveformImagesWithUrls}
          onWaveformDrag={handleWaveformDrag}
          onClipDrag={handleClipDrag}
          onClipEdgeDrag={handleClipEdgeDrag}
          renderPrimaryClip={renderPrimaryClip}
          renderSecondaryClip={renderSecondaryClip}
          height={
            WAVEFORM_HEIGHT +
            subsBases.linkedTrackIds.length * SUBTITLES_CHUNK_HEIGHT
          }
        />
      ) : (
        <div
          className={cn(waveformCss.waveformPlaceholder, waveform$.placeholder)}
        />
      )}

      <KeyboardShortcuts />
    </div>
  )
}

const EMPTY: string[] = []

export default Main

export { $ as main$ }
