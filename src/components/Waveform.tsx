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
import {
  toWaveformCoordinates,
  getSecondsAtXFromWaveform,
} from '../utils/waveformCoordinates'
import WaveformMousedownEvent, {
  WaveformDragAction,
  WaveformDragEvent,
} from '../utils/WaveformMousedownEvent'
import { setCursorX } from '../utils/waveform'
import {
  SELECTION_BORDER_WIDTH,
  SubtitlesCardBase,
  SUBTITLES_CHUNK_HEIGHT,
  WaveformSelectionExpanded,
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
    waveformLength,
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

  const { stepsPerSecond, stepLength, xMin } = viewState
  const subtitles = useMemo(() => {
    return {
      ...allSubtitles,
      cards: limitSubtitlesCardsBasesCardsToDisplayed(allSubtitles.cards, xMin),
    }
  }, [allSubtitles, xMin])

  const height =
    WAVEFORM_HEIGHT + subtitles.totalTracksCount * SUBTITLES_CHUNK_HEIGHT
  const factor = stepsPerSecond * stepLength
  const viewBoxString = getViewBoxString(xMin, height, factor)

  // handleStartClip
  // handleEndClip
  // handleStartMove
  // handleEndMove
  // handleSTartStretch
  // handleEndStretch

  const { handleMouseDown, pendingActionRef } = useWaveformMouseActions(
    svgRef,
    viewState,
    waveformLength,
    playerRef,
    dispatchViewState
  )

  const imageBitmaps = useMemo(() => {
    return images.map(({ path, x, file }) => (
      <image
        key={file.id}
        xlinkHref={new URL(`file://${path}`).toString()}
        style={{ pointerEvents: 'none' }}
        x={x}
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
          width={waveformLength}
          height={height}
        />
        <Clips
          {...{
            clips,
            highlightedClipId,
            stepsPerSecond,
            height,
            waveform: viewState,
            playerRef,
          }}
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
          x={viewState.cursorX}
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
          clipToMove.start - deltaX,
          clipToMove.end - deltaX,
          height
        )}
      />
    )
  }

  return (
    <rect
      ref={rectRef}
      className={WAVEFORM_ACTION_TYPE_TO_CLASSNAMES[action.type]}
      {...getClipRectProps(action.start, action.end, height)}
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
  waveformLength: number,
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>,
  dispatch: (action: WaveformAction) => void
) {
  const { pendingAction } = waveform
  const pendingActionRef = useRef<SVGRectElement | null>(null)

  const mouseIsDown = useRef(false)

  useEffect(() => {
    const handleMouseMoves = (e: MouseEvent) => {
      console.log('down?', mouseIsDown.current)
      if (!mouseIsDown.current) return

      e.preventDefault()
      const svg = svgRef.current
      if (svg) {
        const coords = toWaveformCoordinates(e, svg, waveform.xMin)
        const x = Math.min(waveformLength, coords.x)
        console.log('x: ', x)
        dispatch({ type: 'continuePendingAction', x })
      }
    }
    document.addEventListener('mousemove', handleMouseMoves)
    return () => document.removeEventListener('mousemove', handleMouseMoves)
  }, [dispatch, svgRef, waveform.xMin, waveformLength])

  const handleMouseDown: EventHandler<React.MouseEvent<
    SVGElement
  >> = useCallback(
    (e) => {
      e.preventDefault()
      const coords = toWaveformCoordinates(e, e.currentTarget, waveform.xMin)
      const x = Math.min(waveformLength, coords.x)
      const waveformMousedown = new WaveformMousedownEvent(
        e,
        getSecondsAtXFromWaveform(x)
      )
      document.dispatchEvent(waveformMousedown)
      const { dataset } = e.target as SVGGElement | SVGRectElement

      if (
        dataset &&
        dataset.clipId &&
        (Math.abs(Number(dataset.clipStart) - x) <= SELECTION_BORDER_WIDTH ||
          Math.abs(Number(dataset.clipEnd) - x) <= SELECTION_BORDER_WIDTH)
      ) {
        console.log('strootchie')
        dispatch(
          setPendingAction({
            type: 'STRETCH',
            start: x,
            end: x,
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
            start: x,
            end: x,
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
            start: x,
            end: x,
            viewState: waveform,
          })
        )

      mouseIsDown.current = true
    },
    [waveform, waveformLength, dispatch]
  )

  useEffect(() => {
    const handleMouseUps = (e: MouseEvent) => {
      console.log('mouseup!')
      mouseIsDown.current = false
      dispatch(setPendingAction(null))

      if (!pendingAction) return console.log('NO PENDING ACTION')

      const svg = svgRef.current
      if (!svg) return

      const coords = toWaveformCoordinates(e, svg, waveform.xMin)
      const x = Math.min(waveformLength, coords.x)
      const { dataset } = e.target as SVGGElement | SVGRectElement

      if (
        dataset &&
        ((dataset.clipId && !dataset.clipIsHighlighted) || dataset.chunkIndex)
      ) {
        return
        //  dispatch(
        //   r.selectWaveformItem(
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
        const seconds = getSecondsAtXFromWaveform(x)
        playerRef.current.currentTime = seconds

        setCursorX(x)
      }
      if (pendingAction) {
        const finalAction = {
          ...pendingAction,
          end: x,
          viewState: waveform,
        }
        console.log('dispatching!!', finalAction)
        document.dispatchEvent(new WaveformDragEvent(finalAction))
      }
      // if (!pendingAction) throw new Error('Problem with waveform drag event--no drag start registered')
    }
    document.addEventListener('mouseup', handleMouseUps)
    return () => document.removeEventListener('mouseup', handleMouseUps)
  }, [dispatch, pendingAction, playerRef, svgRef, waveform, waveformLength])

  return {
    handleMouseDown,
    pendingActionRef,
  }
}

export default Waveform

export { $ as waveform$ }
function limitWaveformItemsToDisplayed(
  allWaveformItems: WaveformSelectionExpanded[],
  xMin: number
): any {
  throw new Error('Function not implemented.')
}
