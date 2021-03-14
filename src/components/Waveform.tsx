import React, {
  useRef,
  useCallback,
  useMemo,
  EventHandler,
  MutableRefObject,
  useEffect,
} from 'react'
import cn from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import r from '../redux'
import css from './Waveform.module.css'
import { waveformTimeAtMousePosition } from '../utils/waveformCoordinates'
import WaveformMousedownEvent, {
  WaveformDragAction,
  WaveformDragEvent,
} from '../utils/WaveformMousedownEvent'
import { setCursorX } from '../utils/waveform'
import {
  msToPixels,
  msToSeconds,
  secondsToMs,
  secondsToPixels,
  SELECTION_BORDER_MILLISECONDS,
  SubtitlesCardBase,
  SUBTITLES_CHUNK_HEIGHT,
  WAVEFORM_HEIGHT,
} from '../selectors'
import { SubtitlesTimelines } from './WaveformSubtitlesTimelines'
import { Clips } from './WaveformClips'
import { useWaveformState, WaveformAction } from './useWaveformState'
import { limitSelectorToDisplayedItems } from '../selectors/limitSelectorToDisplayedItems'
import { WAVEFORM_PNG_PIXELS_PER_SECOND } from '../utils/getWaveform'

export enum $ {
  container = 'waveform-container',
  subtitlesTimelinesContainer = 'subtitles-timelines-container',
  subtitlesTimelines = 'subtitles-timeline',
  waveformClipsContainer = 'waveform-clips-container',
  waveformClip = 'waveform-clip',
}

const Cursor = ({
  x,
  height,
  strokeWidth,
}: {
  x: number
  height: number
  strokeWidth: number
}) => (
  <line
    className="cursor"
    stroke="white"
    x1={x}
    y1="-1"
    x2={x}
    y2={height}
    shapeRendering="crispEdges"
    strokeWidth={strokeWidth}
    style={{ pointerEvents: 'none' }}
  />
)
const getViewBoxString = (xMin: number, height: number) =>
  `${xMin} 0 ${3000} ${height}`

const limitSubtitlesCardsBasesCardsToDisplayed = limitSelectorToDisplayedItems(
  (cb: SubtitlesCardBase) => cb.start,
  (cb: SubtitlesCardBase) => cb.end
)

const Waveform = ({
  playerRef,
  waveformState,
}: {
  playerRef: MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>
  waveformState: ReturnType<typeof useWaveformState>
}) => {
  const {
    images,
    clips,
    highlightedClipId,
    allSubtitles,
    highlightedChunkIndex,
    mediaIsLoaded,
  } = useSelector((state: AppState) => ({
    images: r.getWaveformImages(state),
    clips: r.getCurrentFileClips(state),
    highlightedClipId: r.getHighlightedClipId(state),
    allSubtitles: r.getSubtitlesCardBases(state),
    highlightedChunkIndex: r.getHighlightedChunkIndex(state),
    mediaIsLoaded: r.isMediaFileLoaded(state),
  }))

  const {
    state: viewState,
    dispatch: dispatchViewState,
    svgRef,
    visibleWaveformItems,
  } = waveformState

  const dispatch = useDispatch()
  const goToSubtitlesChunk = useCallback(
    (trackId: string, chunkIndex: number) => {
      dispatch(r.goToSubtitlesChunk(trackId, chunkIndex))
    },
    [dispatch]
  )

  const { viewBoxStartMs, pixelsPerSecond } = viewState
  const subtitles = useMemo(() => {
    return {
      ...allSubtitles,
      cards: limitSubtitlesCardsBasesCardsToDisplayed(
        allSubtitles.cards,
        viewBoxStartMs,
        pixelsPerSecond
      ),
    }
  }, [allSubtitles, pixelsPerSecond, viewBoxStartMs])

  const height =
    WAVEFORM_HEIGHT + subtitles.totalTracksCount * SUBTITLES_CHUNK_HEIGHT
  const viewBoxString = getViewBoxString(
    msToPixels(viewBoxStartMs, pixelsPerSecond),
    height
  )

  // handleStartClip
  // handleEndClip
  // handleStartMove
  // handleEndMove
  // handleSTartStretch
  // handleEndStretch

  const { handleMouseDown, pendingActionRef } = useWaveformMouseActions(
    svgRef,
    viewState,
    pixelsPerSecond,
    playerRef,
    dispatchViewState
  )

  const imageBitmaps = useMemo(() => {
    return images.map(({ path, x, file }) => (
      <image
        key={file.id}
        xlinkHref={new URL(`file://${path}`).toString()}
        style={{ pointerEvents: 'none' }}
        x={msToPixels(x, pixelsPerSecond)}
        origin="0 0"
        transform={`scale(${
          1 * (pixelsPerSecond / WAVEFORM_PNG_PIXELS_PER_SECOND)
        }, 1)`}
        height={WAVEFORM_HEIGHT}
      />
    ))
  }, [images, pixelsPerSecond])

  const handleMouseWheel: React.WheelEventHandler = useCallback(
    (e) => {
      dispatchViewState({ type: 'zoom', delta: e.deltaY })
    },
    [dispatchViewState]
  )

  return (
    <svg
      ref={svgRef}
      id="waveform-svg"
      viewBox={viewBoxString}
      preserveAspectRatio="xMinYMin slice"
      className={cn(css.waveformSvg, $.container)}
      onMouseDown={handleMouseDown}
      height={height}
      style={mediaIsLoaded ? undefined : { pointerEvents: 'none' }}
      onWheel={handleMouseWheel}
    >
      <g>
        <rect
          fill="#222222"
          x={0}
          y={0}
          width={secondsToPixels(viewState.durationSeconds, pixelsPerSecond)}
          height={height}
        />
        <Clips
          clips={clips}
          highlightedClipId={highlightedClipId}
          height={height}
          playerRef={playerRef}
          pixelsPerSecond={pixelsPerSecond}
        />
        {viewState.pendingAction && (
          <PendingWaveformItem
            action={viewState.pendingAction}
            height={height}
            rectRef={pendingActionRef}
            pixelsPerSecond={pixelsPerSecond}
          />
        )}
        {imageBitmaps}

        {Boolean(subtitles.cards.length || subtitles.excludedTracks.length) && (
          <SubtitlesTimelines
            pixelsPerSecond={pixelsPerSecond}
            subtitles={subtitles}
            goToSubtitlesChunk={goToSubtitlesChunk}
            highlightedChunkIndex={highlightedChunkIndex}
            waveformItems={visibleWaveformItems}
          />
        )}
        <Cursor
          x={msToPixels(viewState.cursorMs, pixelsPerSecond)}
          height={height}
          strokeWidth={1}
        />
      </g>
    </svg>
  )
}

const WAVEFORM_ACTION_TYPE_TO_CLASSNAMES: Record<
  WaveformDragAction['type'],
  string
> = {
  CREATE: css.waveformPendingClip,
  MOVE: css.waveformPendingClipMove,
  STRETCH: css.waveformPendingStretch,
}

const getClipRectProps = (start: number, end: number, height: number) => ({
  x: Math.min(start, end),
  y: 0,
  width: Math.abs(start - end),
  height,
})

function PendingWaveformItem({
  action,
  height,
  rectRef,
  pixelsPerSecond,
}: {
  action: WaveformDragAction
  height: number
  rectRef: MutableRefObject<SVGRectElement | null>
  pixelsPerSecond: number
}) {
  if (action.type === 'MOVE') {
    const { start, end, clipToMove } = action
    const deltaX = start - end

    return (
      <rect
        ref={rectRef}
        className={WAVEFORM_ACTION_TYPE_TO_CLASSNAMES[action.type]}
        {...getClipRectProps(
          msToPixels(clipToMove.start - deltaX, pixelsPerSecond),
          msToPixels(clipToMove.end - deltaX, pixelsPerSecond),
          height
        )}
      />
    )
  }


  if (action.type === 'STRETCH') {
    const { start, end, clipToStretch } = action
    const originKey =
    Math.abs(start - clipToStretch.start) <
    Math.abs(start - clipToStretch.end)
      ? 'start'
      : 'end'
      const edge = clipToStretch[originKey]

    const deltaX = start - end

    return (
      <rect
        ref={rectRef}
        className={WAVEFORM_ACTION_TYPE_TO_CLASSNAMES[action.type]}
        {...getClipRectProps(
          msToPixels(edge, pixelsPerSecond),
          msToPixels(edge - deltaX, pixelsPerSecond),
          height
        )}
      />
    )
  }
  return (
    <rect
      ref={rectRef}
      className={WAVEFORM_ACTION_TYPE_TO_CLASSNAMES[action.type]}
      {...getClipRectProps(
        msToPixels(action.start, pixelsPerSecond),
        msToPixels(action.end, pixelsPerSecond),
        height
      )}
    />
  )
}

const setPendingAction = (action: WaveformDragAction | null) => ({
  type: 'setPendingAction' as const,
  action,
})
function useWaveformMouseActions(
  svgRef: React.RefObject<SVGSVGElement>,
  waveform: ViewState,
  pixelsPerSecond: number,
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>,
  dispatch: (action: WaveformAction) => void
) {
  const { pendingAction } = waveform
  const pendingActionRef = useRef<SVGRectElement | null>(null)

  const mouseIsDown = useRef(false)

  const durationMilliseconds = secondsToMs(waveform.durationSeconds)

  useEffect(() => {
    const handleMouseMoves = (e: MouseEvent) => {
      if (!mouseIsDown.current) return

      e.preventDefault()
      const svg = svgRef.current
      if (svg) {
        const msAtMouse = waveformTimeAtMousePosition(
          e,
          svg,
          waveform.viewBoxStartMs,
          pixelsPerSecond
        )
        const x = Math.min(durationMilliseconds, msAtMouse)
        dispatch({ type: 'continuePendingAction', ms: x })
      }
    }
    document.addEventListener('mousemove', handleMouseMoves)
    return () => document.removeEventListener('mousemove', handleMouseMoves)
  }, [
    dispatch,
    svgRef,
    waveform.viewBoxStartMs,
    waveform.durationSeconds,
    durationMilliseconds,
    pixelsPerSecond,
  ])

  const handleMouseDown: EventHandler<React.MouseEvent<
    SVGElement
  >> = useCallback(
    (e) => {
      e.preventDefault()
      const msAtMouse = waveformTimeAtMousePosition(
        e,
        e.currentTarget,
        waveform.viewBoxStartMs,
        pixelsPerSecond
      )
      const ms = Math.min(durationMilliseconds, msAtMouse)
      const waveformMousedown = new WaveformMousedownEvent(e, ms / 1000)
      document.dispatchEvent(waveformMousedown)
      const { dataset } = e.target as SVGGElement | SVGRectElement

      if (
        dataset &&
        dataset.clipId &&
        (Math.abs(Number(dataset.clipStart) - ms) <=
          SELECTION_BORDER_MILLISECONDS ||
          Math.abs(Number(dataset.clipEnd) - ms) <=
            SELECTION_BORDER_MILLISECONDS)
      ) {
        dispatch(
          setPendingAction({
            type: 'STRETCH',
            start: ms,
            end: ms,
            clipToStretch: {
              id: dataset.clipId,
              start: Number(dataset.clipStart),
              end: Number(dataset.clipEnd),
            },
            viewState: waveform,
          })
        )
      } else if (dataset && dataset.clipId)
        dispatch(
          setPendingAction({
            type: 'MOVE',
            start: ms,
            end: ms,
            clipToMove: {
              id: dataset.clipId,
              start: Number(dataset.clipStart),
              end: Number(dataset.clipEnd),
            },
            viewState: waveform,
          })
        )
      else
        dispatch(
          setPendingAction({
            type: 'CREATE',
            start: ms,
            end: ms,
            viewState: waveform,
          })
        )

      mouseIsDown.current = true
    },
    [waveform, durationMilliseconds, pixelsPerSecond, dispatch]
  )

  useEffect(() => {
    const handleMouseUps = (e: MouseEvent) => {
      if (!mouseIsDown.current) return
      mouseIsDown.current = false
      dispatch(setPendingAction(null))

      // if (!pendingAction) return console.log('NO PENDING ACTION')

      const svg = svgRef.current
      if (!svg) return

      const msAtMouse = waveformTimeAtMousePosition(
        e,
        svg,
        waveform.viewBoxStartMs,
        pixelsPerSecond
      )
      // not right, first below should be X and not MS
      const ms = Math.min(durationMilliseconds, msAtMouse)
      const { dataset } = e.target as SVGGElement | SVGRectElement

      if (
        dataset &&
        ((dataset.clipId && !dataset.clipIsHighlighted) || dataset.chunkIndex)
      ) {
        return
        //  dispatch(
        //   r. aveformItem(
        //     dataset.clipId
        //       ? {
        //           type: 'Clip',
        //           id: dataset.clipId,
        //           index: Number(dataset.index),
        //         }
        //       : {
        //           type: 'Preview',
        //           index: Number(dataset.chunkIndex),
        //           cardBaseIndex: Number(dataset.index),
        //         }
        //   )
        // )
      }

      if (playerRef.current) {
        playerRef.current.currentTime = msToSeconds(ms)

        setCursorX(msToPixels(ms, pixelsPerSecond))
      }
      if (pendingAction) {
        const finalAction = {
          ...pendingAction,
          end: ms,
          viewState: waveform,
        }
        console.log('DRAGEEVENT', { finalAction })
        document.dispatchEvent(new WaveformDragEvent(finalAction))
      }
      // if (!pendingAction) throw new Error('Problem with waveform drag event--no drag start registered')
    }
    document.addEventListener('mouseup', handleMouseUps)
    return () => document.removeEventListener('mouseup', handleMouseUps)
  }, [
    dispatch,
    durationMilliseconds,
    pendingAction,
    pixelsPerSecond,
    playerRef,
    svgRef,
    waveform,
    waveform.durationSeconds,
  ])

  return {
    handleMouseDown,
    pendingActionRef,
  }
}

export default Waveform

export { $ as waveform$ }
