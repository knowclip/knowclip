import React, { memo, useRef, useCallback } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import * as r from '../redux'
import css from './Waveform.module.css'
import {
  toWaveformCoordinates,
  getSecondsAtXFromWaveform,
} from '../utils/waveformCoordinates'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'

enum $ {
  container = 'waveform-container',
  subtitlesTimelinesContainer = 'subtitles-timelines-container',
  subtitlesTimelines = 'subtitles-timeline',
  waveformClipsContainer = 'waveform-clips-container',
  waveformClip = 'waveform-clip',
}

const { SELECTION_BORDER_WIDTH } = r
const WAVEFORM_HEIGHT = 70

const Cursor = ({ x, height }: { x: number; height: number }) => (
  <line
    stroke="white"
    x1={x}
    y1="-1"
    x2={x}
    y2={height}
    shapeRendering="crispEdges"
  />
)

const getClipRectProps = (start: number, end: number, height: number) => ({
  x: start,
  y: 0,
  width: end - start,
  height: height,
})

type ClipProps = {
  id: string
  start: number
  end: number
  isHighlighted: boolean
  height: number
}
const Clip = ({ id, start, end, isHighlighted, height }: ClipProps) => {
  return (
    <g id={id}>
      <rect
        className={cn(
          css.waveformClip,
          { [css.highlightedClip]: isHighlighted },
          $.waveformClip
        )}
        {...getClipRectProps(start, end, height)}
      />

      <rect
        className={cn(css.waveformClipBorder, {
          [css.highlightedClipBorder]: isHighlighted,
        })}
        x={start}
        y="0"
        width={SELECTION_BORDER_WIDTH}
        height={height}
      />
      <rect
        className={cn(css.waveformClipBorder, {
          [css.highlightedClipBorder]: isHighlighted,
        })}
        x={end - SELECTION_BORDER_WIDTH}
        y="0"
        width={SELECTION_BORDER_WIDTH}
        height={height}
      />
    </g>
  )
}

type ChunkProps = {
  start: number
  end: number
  stepsPerSecond: number
  height: number
}

const PendingClip = ({ start, end, height }: ChunkProps) => (
  <rect
    className={css.waveformPendingClip}
    {...getClipRectProps(start, end, height)}
  />
)

const PendingStretch = ({ start, end, height }: ChunkProps) => (
  <rect
    className={css.waveformPendingStretch}
    {...getClipRectProps(start, end, height)}
  />
)

const getViewBoxString = (xMin: number, height: number) =>
  `${xMin} 0 3000 ${height}`

const Clips = React.memo(
  ({
    clips,
    highlightedClipId,
    height,
  }: {
    clips: Clip[]
    highlightedClipId: string | null
    height: number
  }) => (
    <g className={$.waveformClipsContainer}>
      {clips.map(clip => (
        <Clip
          {...clip}
          key={clip.id}
          isHighlighted={clip.id === highlightedClipId}
          height={height}
        />
      ))}
    </g>
  )
)

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
}) => {
  const clipPathId = `${trackId}__${chunkIndex}`
  const width = chunk.end - chunk.start

  const rect = {
    x: chunk.start,
    y: WAVEFORM_HEIGHT + trackIndex * SUBTITLES_CHUNK_HEIGHT,
    width: width,
    height: SUBTITLES_CHUNK_HEIGHT,
  }
  return (
    <g
      className={css.subtitlesChunk}
      data-chunk-index={chunkIndex}
      data-track-id={trackId}
    >
      <clipPath id={clipPathId}>
        <rect {...rect} width={width - 10} />
      </clipPath>
      <rect
        className={css.subtitlesChunkRectangle}
        data-track-id={trackId}
        data-chunk-index={chunkIndex}
        {...rect}
        rx={SUBTITLES_CHUNK_HEIGHT / 2}
      />
      <text
        clipPath={`url(#${clipPathId})`}
        data-chunk-index={chunkIndex}
        data-track-id={trackId}
        className={css.subtitlesText}
        x={chunk.start + 10}
        y={(trackIndex + 1) * SUBTITLES_CHUNK_HEIGHT - 6 + WAVEFORM_HEIGHT}
      >
        {chunk.text}
      </text>
    </g>
  )
}
const SubtitlesTimelines = memo(
  ({
    subtitles,
    goToSubtitlesChunk,
  }: {
    subtitles: SubtitlesTrack[]
    goToSubtitlesChunk: (trackId: string, chunkIndex: number) => void
  }) => {
    const handleClick = useCallback(
      e => {
        e.stopPropagation()
        goToSubtitlesChunk(
          e.target.dataset.trackId,
          e.target.dataset.chunkIndex
        )
      },
      [goToSubtitlesChunk]
    )
    return (
      <g
        className={cn(css.subtitlesSvg, $.subtitlesTimelinesContainer)}
        width="100%"
        onClick={handleClick}
      >
        {subtitles.map(({ chunks, id }, trackIndex) => (
          <g className={$.subtitlesTimelines} key={id}>
            {chunks.map((chunk, index) => (
              <SubtitlesChunk
                key={`${chunk.start}_${chunk.text}`}
                chunk={chunk}
                trackIndex={trackIndex}
                trackId={id}
                chunkIndex={index}
              />
            ))}
          </g>
        ))}
      </g>
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
  const height = WAVEFORM_HEIGHT + subtitles.length * SUBTITLES_CHUNK_HEIGHT
  const viewBoxString = getViewBoxString(viewBox.xMin, height)
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
      document.dispatchEvent(waveformMousedown)
    },
    [waveform]
  )
  return show ? (
    <svg
      ref={svgRef}
      id="waveform-svg"
      viewBox={viewBoxString}
      preserveAspectRatio="xMinYMin slice"
      className={cn(css.waveformSvg, $.container)}
      width="100%"
      onMouseDown={onMouseDown}
      height={height}
    >
      <rect
        fill="#222222"
        x={0}
        y={0}
        width={waveform.length}
        height={height}
      />
      <Clips {...{ clips, highlightedClipId, stepsPerSecond, height }} />
      {pendingClip && (
        <PendingClip
          {...pendingClip}
          stepsPerSecond={stepsPerSecond}
          height={height}
        />
      )}
      {pendingStretch && (
        <PendingStretch
          {...pendingStretch}
          stepsPerSecond={stepsPerSecond}
          height={height}
        />
      )}
      {path && (
        <image xlinkHref={`file://${path}`} style={{ pointerEvents: 'none' }} />
      )}

      {Boolean(subtitles.length) && (
        <SubtitlesTimelines
          subtitles={subtitles}
          goToSubtitlesChunk={goToSubtitlesChunk}
        />
      )}
      <Cursor {...cursor} height={height} />
    </svg>
  ) : (
    <div className={css.waveformPlaceholder} />
  )
}

export default Waveform

export { $ as waveform$ }
