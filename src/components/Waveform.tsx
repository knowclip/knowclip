import React, {
  useRef,
  useCallback,
  useMemo,
  EventHandler,
  useState,
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
  SUBTITLES_CHUNK_HEIGHT,
  WAVEFORM_HEIGHT,
} from '../selectors'
import { SubtitlesTimelines } from './WaveformSubtitlesTimelines'
import { Clips } from './WaveformClips'

export enum $ {
  container = 'waveform-container',
  subtitlesTimelinesContainer = 'subtitles-timelines-container',
  subtitlesTimelines = 'subtitles-timeline',
  waveformClipsContainer = 'waveform-clips-container',
  waveformClip = 'waveform-clip',
}

const Cursor = ({ x, height }: { x: number; height: number }) => (
  <line
    className="cursor"
    stroke="white"
    x1={x}
    y1="-1"
    x2={x}
    y2={height}
    shapeRendering="crispEdges"
    style={{ pointerEvents: 'none' }}
  />
)

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

const PendingWaveformItem = ({
  action,
  height,
  rectRef,
}: {
  action: WaveformDragAction
  stepsPerSecond: number
  height: number
  rectRef: MutableRefObject<SVGRectElement | null>
}) => {
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

const getViewBoxString = (xMin: number, height: number) =>
  `${xMin} 0 3000 ${height}`

const Waveform = ({
  playerRef,
}: {
  playerRef: MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>
}) => {
  const {
    waveform,
    images,
    clips,
    highlightedClipId,
    subtitles,
    highlightedChunkIndex,
    waveformItems,
    mediaIsLoaded,
  } = useSelector((state: AppState) => ({
    waveform: r.getWaveform(state),
    images: r.getWaveformImages(state),
    clips: r.getCurrentFileClips(state),
    highlightedClipId: r.getHighlightedClipId(state),
    subtitles: r.getDisplayedSubtitlesCardBases(state),
    highlightedChunkIndex: r.getHighlightedChunkIndex(state),
    waveformItems: r.getDisplayedWaveformItems(state),
    mediaIsLoaded: r.isMediaFileLoaded(state),
  }))

  const dispatch = useDispatch()
  const goToSubtitlesChunk = useCallback(
    (trackId: string, chunkIndex: number) => {
      dispatch(r.goToSubtitlesChunk(trackId, chunkIndex))
    },
    [dispatch]
  )

  const { viewBox, cursor, stepsPerSecond } = waveform
  const height =
    WAVEFORM_HEIGHT + subtitles.totalTracksCount * SUBTITLES_CHUNK_HEIGHT
  const viewBoxString = getViewBoxString(viewBox.xMin, height)
  const svgRef = useRef<SVGSVGElement>(null)

  // handleStartClip
  // handleEndClip
  // handleStartMove
  // handleEndMove
  // handleSTartStretch
  // handleEndStretch
  const [pendingAction, setPendingAction] = useState<WaveformDragAction | null>(
    null
  )
  const pendingActionRef = useRef<SVGRectElement | null>(null)

  const handleMouseMoves = useCallback(
    (e: MouseEvent) => {
      const pendingActionDisplay = pendingActionRef.current
      const svg = svgRef.current
      if (pendingActionDisplay && svg) {
        const coords = toWaveformCoordinates(e, svg, waveform.viewBox.xMin)
        const x = Math.min(waveform.length, coords.x)
        // pendingActionDisplay.setAttribute('x1', String(x))
        setPendingAction((action) => {
          return action ? { ...action, end: x } : null
        })
      }
    },
    [waveform.length, waveform.viewBox.xMin]
  )

  const handleMouseDown: EventHandler<React.MouseEvent<
    SVGElement
  >> = useCallback(
    (e) => {
      e.preventDefault()
      const coords = toWaveformCoordinates(
        e,
        e.currentTarget,
        waveform.viewBox.xMin
      )
      const x = Math.min(waveform.length, coords.x)
      const waveformMousedown = new WaveformMousedownEvent(
        e,
        getSecondsAtXFromWaveform(waveform, x)
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
        setPendingAction({
          type: 'STRETCH',
          start: x,
          end: x,
          clipToStretch: {
            id: dataset.clipId,
            start: Number(dataset.clipStart),
            end: Number(dataset.clipEnd),
          },
        })
      } else if (dataset && dataset.clipId)
        setPendingAction({
          type: 'MOVE',
          start: x,
          end: x,
          clipToMove: {
            id: dataset.clipId,
            start: Number(dataset.clipStart),
            end: Number(dataset.clipEnd),
          },
        })
      else setPendingAction({ type: 'CREATE', start: x, end: x })

      const handleNextMouseUp = (e: MouseEvent) => {
        // document.removeEventListener('mouseup', handleNextMouseUp)
        document.removeEventListener('mousemove', handleMouseMoves)

        // setPendingAction(null)
      }

      document.addEventListener('mouseup', handleNextMouseUp)
      document.addEventListener('mousemove', handleMouseMoves)
    },
    [waveform, handleMouseMoves]
  )

  useEffect(() => {
    const handleMouseUps = (e: MouseEvent) => {
      console.log('mouseup!')
      if (!pendingAction) return console.log('NO PENDING ACTION')
      if (pendingAction) {
        setPendingAction(null)
      }

      const svg = svgRef.current
      if (!svg) return

      const coords = toWaveformCoordinates(e, svg, waveform.viewBox.xMin)
      const x = Math.min(waveform.length, coords.x)
      const { dataset } = e.target as SVGGElement | SVGRectElement

      if (
        dataset &&
        ((dataset.clipId && !dataset.clipIsHighlighted) || dataset.chunkIndex)
      ) {
        return
      }

      if (playerRef.current) {
        const seconds = getSecondsAtXFromWaveform(waveform, x)
        playerRef.current.currentTime = seconds

        setCursorX(x)
      }
      if (pendingAction) {
        const finalAction = {
          ...pendingAction,
          end: x,
        }
        console.log('dispatching!!', finalAction)
        document.dispatchEvent(new WaveformDragEvent(finalAction))
        setPendingAction(null)
      }
      // if (!pendingAction) throw new Error('Problem with waveform drag event--no drag start registered')
    }
    document.addEventListener('mouseup', handleMouseUps)
    return () => document.removeEventListener('mouseup', handleMouseUps)
  }, [pendingAction, playerRef, waveform])

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
          width={waveform.length}
          height={height}
        />
        <Clips
          {...{
            clips,
            highlightedClipId,
            stepsPerSecond,
            height,
            waveform,
            playerRef,
          }}
        />
        {pendingAction && (
          <PendingWaveformItem
            action={pendingAction}
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
        <Cursor x={cursor.x} height={height} />
      </g>
    </svg>
  )
}

export default Waveform

export { $ as waveform$ }
