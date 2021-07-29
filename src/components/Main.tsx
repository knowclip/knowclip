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
  calculateRegions,
  secondsToMs,
  WaveformRegion,
  WaveformState,
  msToSeconds,
  setCursorX,
  msToPixels,
  getNewWaveformSelectionAt,
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
import { useRenderSecondaryClip } from './WaveformSubtitlesTimelines'
import { useWaveformEventHandlers } from './useWaveformEventHandlers'
import { GetWaveformItem } from 'clipwave/dist/useWaveform'
import { setCurrentTime } from '../utils/media'
import { waveform$ } from './Waveform'
// import { useWaveformSelectionSyncWithRedux } from './useWaveformSelectionSyncWithRedux'

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
      // waveformItems: r.getWaveformItems(state),
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

  // const waveformItemsCache = useRef<Record<WaveformItem['id'], WaveformItem>>(
  //   {}
  // )
  // useEffect(() => {
  //   waveformItemsCache.current = {}
  // }, [clipsMap, subsBases, mediaFileId])
  const getWaveformItem = useCallback(
    (id: string): WaveformItem | null => {
      // const cachedItem = waveformItemsCache.current[id]
      // if (cachedItem) return cachedItem
      const clip: Clip | null = clipsMap[id] || null
      if (clip && clip.fileId === mediaFileId) {
        const item = clip
        // waveformItemsCache.current[id] = item
        return item
      }
      const subsBase: SubtitlesCardBase | null = subsBases.cardsMap[id]
      if (subsBase) {
        const item = subsBase
        // waveformItemsCache.current[id] = item
        return item
      }

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

  // TODO: call this whenever addClip or addClips is called
  // OR: add flag to redux state "regions_refresh_needed"
  // and refresh here whenever flag goes on, then turn it off.
  const getFreshRegions = useCallback(() => {
    const sortedItems = sortWaveformItems([
      ...currentFileClipsOrder.map((id) => clipsMap[id]),
      ...subsBases.cards,
    ])
    const { regions } = calculateRegions(
      sortedItems,
      secondsToMs(waveform.state.durationSeconds)
    )
    return {
      regions,
      newSelection: getNewWaveformSelectionAt(
        getWaveformItem,
        regions,
        secondsToMs(playerRef.current?.currentTime || 0),
        selection.selection
      ),
    }
  }, [
    clipsMap,
    currentFileClipsOrder,
    getWaveformItem,
    selection.selection,
    subsBases.cards,
    waveform.state.durationSeconds,
  ])

  useEffect(() => {
    const recalculate = (e: any) => {
      const { regions, newSelection } = getFreshRegions()
      waveform.dispatch({
        type: 'SET_REGIONS',
        regions,
        newSelection,
      })
      console.log('recalculate event!', e, regions)
    }
    document.addEventListener('recalculate-waveform-regions', recalculate)
    return () =>
      document.removeEventListener('recalculate-waveform-regions', recalculate)
  }, [getFreshRegions, waveform])

  const prevSubsBases = usePrevious(subsBases)
  useEffect(() => {
    if (subsBases !== prevSubsBases) {
      document.dispatchEvent(new RecalculateWaveformRegionsEvent())
      // const { regions, newSelection } = getFreshRegions()
      // waveform.dispatch({
      //   type: 'SET_REGIONS',
      //   regions,
      //   newSelection,
      // })
    }
  }, [prevSubsBases, subsBases])

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
  const { getItem } = waveform
  const { regions, pixelsPerSecond } = waveform.state
  const selectPreviousWaveformItem = useCallback(() => {
    const previous = getPreviousWaveformItem({
      currentSelection: selection.selection,
      regions,
      getItem,
    })
    if (previous) {
      setCursorX(msToPixels(previous.item.start, pixelsPerSecond))
      setCurrentTime(msToSeconds(previous.item.start))
      waveform.actions.selectItem(previous.regionIndex, previous.item.id)
    }
  }, [getItem, pixelsPerSecond, regions, selection.selection, waveform.actions])
  const selectNextWaveformItem = useCallback(() => {
    const next = getNextWaveformItem({
      currentSelection: selection.selection,
      regions,
      getItem,
    })
    if (next) {
      setCursorX(msToPixels(next.item.start, pixelsPerSecond))
      setCurrentTime(msToSeconds(next.item.start))
      waveform.actions.selectItem(next.regionIndex, next.item.id)
    }
  }, [getItem, pixelsPerSecond, regions, selection.selection, waveform.actions])

  const {
    handleWaveformDrag,
    handleClipDrag,
    handleClipEdgeDrag,
  } = useWaveformEventHandlers({
    playerRef,
    dispatch,
    waveform,
    highlightedClipId,
    selectPrevious: selectPreviousWaveformItem,
    selectNext: selectNextWaveformItem,
  })

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
          selectPrevious={selectPreviousWaveformItem}
          selectNext={selectNextWaveformItem}
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
          renderSecondaryClip={renderSecondaryClip}
          height={
            WAVEFORM_HEIGHT +
            subsBases.linkedTrackIds.length * SUBTITLES_CHUNK_HEIGHT
          }
        />
      ) : (
        // <div className={waveformCss.waveformPlaceholder} />
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

function getPreviousWaveformItem({
  currentSelection,
  regions,
  getItem,
}: {
  currentSelection: WaveformState['selection']
  regions: WaveformRegion[]
  getItem: GetWaveformItem
}) {
  let loopedAround = false
  let i = currentSelection.regionIndex
  let cycleComplete = false
  while (!cycleComplete) {
    if (i === 0) {
      loopedAround = true
      i = regions.length - 1
    } else {
      // or below?
      i--
    }

    const region = regions[i]
    if (!region) console.error('no prev region found at ', i)
    const { start: regionStart, itemIds } = region

    const firstItemStartingNowId = itemIds.find((id) => {
      const item = getItem(id)
      return item?.start === regionStart
    })
    if (firstItemStartingNowId)
      return {
        regionIndex: i,
        item: getItem(firstItemStartingNowId)!,
      }

    if (loopedAround && i === currentSelection.regionIndex) cycleComplete = true
  }
}

function getNextWaveformItem({
  currentSelection,
  regions,
  getItem,
}: {
  currentSelection: WaveformState['selection']
  regions: WaveformRegion[]
  getItem: GetWaveformItem
}) {
  let loopedAround = false
  let i = currentSelection.regionIndex
  let cycleComplete = false
  while (!cycleComplete) {
    if (i === regions.length - 1) {
      loopedAround = true
      i = 0
    } else {
      // or below?
      i++
    }

    const region = regions[i]
    const { start: regionStart, itemIds } = region

    const firstItemStartingNowId = itemIds.find((id) => {
      const item = getItem(id)
      return item?.start === regionStart
    })
    if (firstItemStartingNowId)
      return {
        regionIndex: i,
        item: getItem(firstItemStartingNowId)!,
      }

    if (loopedAround && i === currentSelection.regionIndex) cycleComplete = true
  }
}

export class RecalculateWaveformRegionsEvent extends Event {
  constructor() {
    super('recalculate-waveform-regions')
  }
}
