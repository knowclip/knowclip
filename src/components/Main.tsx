import React, { useCallback, useMemo, useState } from 'react'
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CircularProgress } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import cn from 'clsx'
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
import { useWaveformRenderSubtitlesChunk } from './WaveformSubtitlesChunk'
import { waveform$ } from './waveformTestLabels'
import { useWaveformRenderClip } from './WaveformClip'
import { getFreshRegions } from '../epics/getFreshRegions'
import { isWaveformItemSelectable } from '../utils/clipwave/isWaveformItemSelectable'
import { useWaveformEventHandlers } from '../utils/clipwave/useWaveformEventHandlers'

import { main$ as $ } from './Main.testLabels'
import { CLIPWAVE_ID } from '../utils/clipwave'

const Main = () => {
  const routeParams = useParams()
  const {
    loop,
    mediaIsEffectivelyLoading,
    currentProject,
    currentMediaUrl,
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
      currentMediaUrl: r.getLoadedMediaUrl(state),
      currentMediaFile,
      clipsIdsForExport: currentMediaFile
        ? state.clips.idsByMediaFileId[currentMediaFile.id]
        : EMPTY,
      subtitles: r.getSubtitlesFilesWithTracks(state),
      viewMode: state.settings.viewMode,
      localServerAddress: state.session.localServerAddress,
      waveformImages: r.getWaveformImages(state),
      clipsMap: r.getClipsObject(state),
      currentFileClipsOrder: r.getCurrentFileClipsOrder(state),
      subsBases: r.getSubtitlesCardBases(state),
      editing: r.isUserEditingCards(state),
    }
  })

  const waveformImagesWithUrls = useMemo(() => {
    return waveformImages.map(
      ({ file: { startSeconds, endSeconds }, url }) => ({
        url,
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
  const waveform = useWaveform({
    getItemFn: getWaveformItem,
    id: CLIPWAVE_ID,
    maxViewportWidth: useWindowInnerWidth(),
  })
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
  const { playing: mediaIsPlaying } = usePlayButtonSync(
    waveform.state.pixelsPerSecond,
    playerRef
  )

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
  const renderSecondaryClip = useWaveformRenderSubtitlesChunk(waveform)

  const idFromParams = routeParams.projectId!
  const currentProjectId = currentProject?.id || null
  const closed = useRef(false)
  const prevProjectId = usePrevious(currentProjectId)
  const navigate = useNavigate()
  useEffect(() => {
    if (prevProjectId && !currentProjectId) {
      closed.current = true
      navigate('/')
    }
    if (!closed.current && currentProjectId !== idFromParams) {
      dispatch(actions.openProjectRequestById(idFromParams))
    }
  }, [currentProjectId, dispatch, idFromParams, navigate, prevProjectId])

  return (
    <div className={css.container} id={$.container}>
      <DarkTheme>
        <Header
          currentProjectId={currentProjectId}
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
            key={String(currentMediaUrl)}
            className={css.media}
            currentMediaUrl={currentMediaUrl}
            loop={loop}
            metadata={currentMediaFile}
            subtitles={subtitles}
            viewMode={viewMode}
            playerRef={playerRef}
            onMediaLoaded={handleMediaLoaded}
            onTimeUpdate={onTimeUpdate}
          />
        )}

        {currentProject && (
          <FlashcardSection
            mediaFile={currentMediaFile}
            className={css.flashcardSection}
            projectFile={currentProject}
            selectPrevious={selectPreviousCard}
            selectNext={selectNextCard}
            mediaIsPlaying={mediaIsPlaying}
          />
        )}
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
          style={{ background: 'gray', alignSelf: 'flex-start', width: '100%' }}
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

function useWindowInnerWidth() {
  const [windowInnerWidth, setWindowInnerWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handleResize = () => {
      setWindowInnerWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return windowInnerWidth
}
