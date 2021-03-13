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
import { toWaveformCoordinates } from '../utils/waveformCoordinates'
import WaveformMousedownEvent, {
  WaveformDragAction,
  WaveformDragEvent,
} from '../utils/WaveformMousedownEvent'
import { setCursorX } from '../utils/waveform'
import {
  msToPixels,
  SELECTION_BORDER_WIDTH,
  SubtitlesCardBase,
  SUBTITLES_CHUNK_HEIGHT,
  WAVEFORM_HEIGHT,
} from '../selectors'
import { SubtitlesTimelines } from './WaveformSubtitlesTimelines'
import { Clips } from './WaveformClips'
import { useWaveformState, WaveformAction } from './useWaveformState'
import { limitSelectorToDisplayedItems } from '../selectors/limitSelectorToDisplayedItems'

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
const getViewBoxString = (xMin: number, height: number, factor: number) =>
  `${xMin} 0 ${factor * 60} ${height}`

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
    waveformItems,
  } = waveformState

  const dispatch = useDispatch()
  const goToSubtitlesChunk = useCallback(
    (trackId: string, chunkIndex: number) => {
      dispatch(r.goToSubtitlesChunk(trackId, chunkIndex))
    },
    [dispatch]
  )

  const { stepsPerSecond, stepLength, viewBoxStartMs } = viewState
  const subtitles = useMemo(() => {
    return {
      ...allSubtitles,
      cards: limitSubtitlesCardsBasesCardsToDisplayed(
        allSubtitles.cards,
        viewBoxStartMs
      ),
    }
  }, [allSubtitles, viewBoxStartMs])

  const height =
    WAVEFORM_HEIGHT + subtitles.totalTracksCount * SUBTITLES_CHUNK_HEIGHT
  const factor = stepsPerSecond * stepLength
  const viewBoxString = getViewBoxString(
    msToPixels(viewBoxStartMs),
    height,
    factor
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
    playerRef,
    dispatchViewState
  )

  const imageBitmaps = useMemo(() => {
    return images.map(({ path, x, file }) => (
      <image
        key={file.id}
        xlinkHref={new URL(`file://${path}`).toString()}
        style={{ pointerEvents: 'none' }}
        x={msToPixels(x)}
      />
    ))
  }, [images])

  return (
    <svg
      ref={svgRef}
      id="waveform-svg"
      viewBox={viewBoxString}
      preserveAspectRatio="xMinYMin slice"
      className={cn(css.waveformSvg, $.container)}
      width="100%"
      onMouseDown={handleMouseDown}
      height={height}
      style={mediaIsLoaded ? undefined : { pointerEvents: 'none' }}
    >
      <g>
        <rect
          fill="#222222"
          x={0}
          y={0}
          width={msToPixels(viewState.durationSeconds * 1000)}
          height={height}
        />
        <Clips
          clips={clips}
          highlightedClipId={highlightedClipId}
          height={height}
          playerRef={playerRef}
        />
        {viewState.pendingAction && (
          <PendingWaveformItem
            action={viewState.pendingAction}
            stepsPerSecond={stepsPerSecond}
            height={height}
            rectRef={pendingActionRef}
          />
        )}
        {imageBitmaps}

        {Boolean(subtitles.cards.length || subtitles.excludedTracks.length) && (
          <SubtitlesTimelines
            subtitles={subtitles}
            goToSubtitlesChunk={goToSubtitlesChunk}
            highlightedChunkIndex={highlightedChunkIndex}
            waveformItems={waveformItems}
          />
        )}
        <Cursor
          x={msToPixels(viewState.cursorMs)}
          height={height}
          strokeWidth={stepLength}
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
}: {
  action: WaveformDragAction
  stepsPerSecond: number
  height: number
  rectRef: MutableRefObject<SVGRectElement | null>
}) {
  if (action.type === 'MOVE') {
    const { start, end, clipToMove } = action
    const deltaX = start - end

    return (
      <rect
        ref={rectRef}
        className={WAVEFORM_ACTION_TYPE_TO_CLASSNAMES[action.type]}
        {...getClipRectProps(
          msToPixels(clipToMove.start - deltaX),
          msToPixels(clipToMove.end - deltaX),
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
        msToPixels(action.start),
        msToPixels(action.end),
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
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>,
  dispatch: (action: WaveformAction) => void
) {
  const { pendingAction } = waveform
  const pendingActionRef = useRef<SVGRectElement | null>(null)

  const mouseIsDown = useRef(false)

  useEffect(() => {
    const handleMouseMoves = (e: MouseEvent) => {
      if (!mouseIsDown.current) return

      e.preventDefault()
      const svg = svgRef.current
      if (svg) {
        const coords = toWaveformCoordinates(e, svg, waveform.viewBoxStartMs)
        const x = Math.min(waveform.durationSeconds * 1000, coords.ms)
        dispatch({ type: 'continuePendingAction', ms: x })
      }
    }
    document.addEventListener('mousemove', handleMouseMoves)
    return () => document.removeEventListener('mousemove', handleMouseMoves)
  }, [dispatch, svgRef, waveform.viewBoxStartMs, waveform.durationSeconds])

  const handleMouseDown: EventHandler<React.MouseEvent<
    SVGElement
  >> = useCallback(
    (e) => {
      e.preventDefault()
      const coords = toWaveformCoordinates(
        e,
        e.currentTarget,
        waveform.viewBoxStartMs
      )
      const ms = Math.min(waveform.durationSeconds * 1000, coords.ms)
      const waveformMousedown = new WaveformMousedownEvent(e, ms / 1000)
      document.dispatchEvent(waveformMousedown)
      const { dataset } = e.target as SVGGElement | SVGRectElement

      if (
        dataset &&
        dataset.clipId &&
        (msToPixels(Math.abs(Number(dataset.clipStart) - ms)) <=
          SELECTION_BORDER_WIDTH ||
          msToPixels(Math.abs(Number(dataset.clipEnd) - ms)) <=
            SELECTION_BORDER_WIDTH)
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
    [waveform, dispatch]
  )

  useEffect(() => {
    const handleMouseUps = (e: MouseEvent) => {
      if (!mouseIsDown.current) return
      mouseIsDown.current = false
      dispatch(setPendingAction(null))

      // if (!pendingAction) return console.log('NO PENDING ACTION')

      const svg = svgRef.current
      if (!svg) return

      const coords = toWaveformCoordinates(e, svg, waveform.viewBoxStartMs)
      // not right, first below should be X and not MS
      const ms = Math.min(waveform.durationSeconds * 1000, coords.ms)
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
        const seconds = ms / 1000
        playerRef.current.currentTime = seconds

        setCursorX(msToPixels(ms))
      }
      if (pendingAction) {
        const finalAction = {
          ...pendingAction,
          end: ms,
          viewState: waveform,
        }
        document.dispatchEvent(new WaveformDragEvent(finalAction))
      }
      // if (!pendingAction) throw new Error('Problem with waveform drag event--no drag start registered')
    }
    document.addEventListener('mouseup', handleMouseUps)
    return () => document.removeEventListener('mouseup', handleMouseUps)
  }, [
    dispatch,
    pendingAction,
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
