import React, { Fragment, memo, useRef, useCallback } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import * as r from '../redux'
import css from './Waveform.module.css'
import {
  toWaveformCoordinates,
  getSecondsAtXFromWaveform,
} from '../utils/waveformCoordinates'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'

export const testLabels = { subtitlesContainer: 'subtitles-container' } as const

const { SELECTION_BORDER_WIDTH } = r
const HEIGHT = 70

const Cursor = ({ x }: { x: number }) => (
  <line
    stroke="black"
    x1={x}
    y1="-1"
    x2={x}
    y2={HEIGHT}
    shapeRendering="crispEdges"
  />
)

const getClipPath = (start: number, end: number) =>
  `M${start} 0 L${end} 0 L${end} ${HEIGHT} L${start} ${HEIGHT} L${start} 0`

type ClipProps = {
  id: string
  start: number
  end: number
  isHighlighted: boolean
}
const Clip = ({ id, start, end, isHighlighted }: ClipProps) => {
  return (
    <g id={id}>
      <path
        className={cn('waveform-clip', { highlightedClip: isHighlighted })}
        d={getClipPath(start, end)}
      />
      <rect
        className={cn('waveform-clip-border', {
          highlightedClipBorder: isHighlighted,
        })}
        x={start}
        y="0"
        width={SELECTION_BORDER_WIDTH}
        height={HEIGHT}
      />
      <rect
        className={cn('waveform-clip-border', {
          highlightedClipBorder: isHighlighted,
        })}
        x={end - SELECTION_BORDER_WIDTH}
        y="0"
        width={SELECTION_BORDER_WIDTH}
        height={HEIGHT}
      />
    </g>
  )
  // <path className="waveform-clip-border" d={`M${start} 0 L${leftBorderInnerEdge} 0 L`} />
}

type ChunkProps = { start: number; end: number; stepsPerSecond: number }

const PendingClip = ({ start, end }: ChunkProps) => (
  <path className="waveform-pending-clip" d={getClipPath(start, end)} />
)

const PendingStretch = ({ start, end }: ChunkProps) => (
  <path className="waveform-pending-stretch" d={getClipPath(start, end)} />
)

const getViewBoxString = (xMin: number) => `${xMin} 0 3000 ${HEIGHT}`
const getSubtitlesViewBoxString = (xMin: number, yMax: number) =>
  `${xMin} 0 3000 ${yMax}`

const Clips = React.memo(
  ({
    clips,
    highlightedClipId,
  }: {
    clips: Clip[]
    highlightedClipId: string | null
  }) => (
    <g className="waveform-clips">
      {clips.map(clip => (
        <Clip
          {...clip}
          key={clip.id}
          isHighlighted={clip.id === highlightedClipId}
        />
      ))}
    </g>
  )
)

const getSubtitlesPath = (
  startX: number,
  endX: number,
  startY: number,
  endY: number
) => {
  return `M${startX} ${startY} L${endX} ${startY} L${endX} ${endY} L${startX} ${endY} L${startX} ${startY}`
}

const SUBTITLES_CHUNK_HEIGHT = 24

const SubtitlesChunk = ({
  chunk,
  trackIndex,
  chunkIndex,
  trackId,
}: {
  chunk: SubtitlesChunk
  trackIndex: number
  chunkIndex: number
  trackId: string
}) => (
  <g
    className={css.subtitlesChunk}
    data-chunk-index={chunkIndex}
    data-track-id={trackId}
  >
    <path
      className={css.subtitlesChunkRectangle}
      data-track-id={trackId}
      data-chunk-index={chunkIndex}
      d={getSubtitlesPath(
        chunk.start,
        chunk.end,
        trackIndex * SUBTITLES_CHUNK_HEIGHT,
        (trackIndex + 1) * SUBTITLES_CHUNK_HEIGHT
      )}
    />
    <text
      data-chunk-index={chunkIndex}
      data-track-id={trackId}
      className={css.subtitlesText}
      x={chunk.start + 4}
      y={(trackIndex + 1) * SUBTITLES_CHUNK_HEIGHT - 6}
      width={(trackIndex + 1) * SUBTITLES_CHUNK_HEIGHT - chunk.start}
    >
      {chunk.text}
    </text>
  </g>
)

const SubtitlesTimelines = memo(
  ({
    subtitles,
    viewBox,
    goToSubtitlesChunk,
  }: {
    subtitles: SubtitlesTrack[]
    viewBox: WaveformViewBox
    goToSubtitlesChunk: (trackId: string, chunkIndex: number) => void
  }) => {
    const handleClick = useCallback(
      e =>
        goToSubtitlesChunk(
          e.target.dataset.trackId,
          e.target.dataset.chunkIndex
        ),
      [goToSubtitlesChunk]
    )
    return (
      <svg
        className={cn(css.subtitlesSvg, testLabels.subtitlesContainer)}
        preserveAspectRatio="xMinYMin slice"
        viewBox={getSubtitlesViewBoxString(
          viewBox.xMin,
          subtitles.length * SUBTITLES_CHUNK_HEIGHT
        )}
        width="100%"
        height={subtitles.length * SUBTITLES_CHUNK_HEIGHT}
        onClick={handleClick}
      >
        {subtitles.map(({ chunks, id }, trackIndex) =>
          chunks.map((chunk, index) => (
            <SubtitlesChunk
              key={`${chunk.start}_${chunk.text}`}
              chunk={chunk}
              trackIndex={trackIndex}
              trackId={id}
              chunkIndex={index}
            />
          ))
        )}
      </svg>
    )
  }
)

const Waveform = ({ show }: { show: boolean }) => {
  const {
    waveform,
    path,
    clips,
    pendingClip,
    pendingStretch,
    highlightedClipId,
    subtitles,
  } = useSelector((state: AppState) => ({
    waveform: r.getWaveform(state),
    path: r.getWaveformPath(state),
    clips: r.getCurrentFileClips(state),
    pendingClip: r.getPendingClip(state),
    pendingStretch: r.getPendingStretch(state),
    highlightedClipId: r.getHighlightedClipId(state),
    subtitles: r.getSubtitlesTracks(state),
  }))

  const dispatch = useDispatch()
  const goToSubtitlesChunk = useCallback(
    (trackId: string, chunkIndex: number) => {
      dispatch(r.goToSubtitlesChunk(trackId, chunkIndex))
    },
    [dispatch]
  )

  const { viewBox, cursor, stepsPerSecond } = waveform
  const viewBoxString = getViewBoxString(viewBox.xMin)
  const svgRef = useRef(null)
  const onMouseDown = useCallback(
    e => {
      const coords = toWaveformCoordinates(
        e,
        e.currentTarget,
        waveform.viewBox.xMin
      )
      const waveformMousedown = new WaveformMousedownEvent(
        e.currentTarget,
        getSecondsAtXFromWaveform(waveform, coords.x)
      )
      console.log({ waveformMousedown })
      document.dispatchEvent(waveformMousedown)
    },
    [waveform]
  )
  return (
    <Fragment>
      <svg
        ref={svgRef}
        style={show ? {} : { display: 'none' }}
        id="waveform-svg"
        viewBox={viewBoxString}
        preserveAspectRatio="xMinYMin slice"
        className="waveform-svg"
        width="100%"
        onMouseDown={onMouseDown}
        height={HEIGHT}
      >
        {path && <image xlinkHref={`file://${path}`} />}
        <Cursor {...cursor} />
        <Clips {...{ clips, highlightedClipId, stepsPerSecond }} />
        {pendingClip && (
          <PendingClip {...pendingClip} stepsPerSecond={stepsPerSecond} />
        )}
        {pendingStretch && (
          <PendingStretch {...pendingStretch} stepsPerSecond={stepsPerSecond} />
        )}
      </svg>
      {Boolean(subtitles.length) && (
        <SubtitlesTimelines
          subtitles={subtitles}
          viewBox={viewBox}
          goToSubtitlesChunk={goToSubtitlesChunk}
        />
      )}
    </Fragment>
  )
}

export default Waveform
