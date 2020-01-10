import React, { Fragment, memo, useRef, useCallback } from 'react'
import cn from 'classnames'
import { connect } from 'react-redux'
import * as r from '../redux'
import css from './Waveform.module.css'
import { toWaveformCoordinates } from '../utils/waveformCoordinates'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'

const { SELECTION_BORDER_WIDTH } = r
const HEIGHT = 70

const Cursor = ({ x, y }) => (
  // null
  <line
    stroke="black"
    x1={x}
    y1="-1"
    x2={x}
    y2={HEIGHT}
    shapeRendering="crispEdges"
  />
)

const getClipPath = (startRaw, endRaw, stepsPerSecond) => {
  const start = startRaw
  const end = endRaw
  return `M${start} 0 L${end} 0 L${end} ${HEIGHT} L${start} ${HEIGHT} L${start} 0`
}

const Clip = ({ id, start, end, stepsPerSecond, isHighlighted, flashcard }) => {
  return (
    <g id={id}>
      <path
        className={cn('waveform-clip', { highlightedClip: isHighlighted })}
        d={getClipPath(start, end, stepsPerSecond)}
      />
      {/*<text x={start} y={90} width={end - start}>{Object.values(flashcard.fields)[0]}</text>*/}
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

const PendingClip = ({ start, end, stepsPerSecond }) => (
  <path
    className="waveform-pending-clip"
    d={getClipPath(start, end, stepsPerSecond)}
  />
)

const PendingStretch = ({ start, end, stepsPerSecond }) => (
  <path
    className="waveform-pending-stretch"
    d={getClipPath(start, end, stepsPerSecond)}
  />
)

const getViewBoxString = xMin => `${xMin} 0 3000 ${HEIGHT}`
const getSubtitlesViewBoxString = (xMin, yMax) => `${xMin} 0 3000 ${yMax}`

const Clips = React.memo(({ clips, highlightedClipId, stepsPerSecond }) => (
  <g className="waveform-clips">
    {clips.map(clip => (
      <Clip
        {...clip}
        key={clip.id}
        stepsPerSecond={stepsPerSecond}
        isHighlighted={clip.id === highlightedClipId}
      />
    ))}
  </g>
))

const getSubtitlesPath = (
  startXRaw,
  endXRaw,
  startYRaw,
  endYRaw,
  stepsPerSecond
) => {
  const startX = startXRaw
  const endX = endXRaw
  return `M${startX} ${startYRaw} L${endX} ${startYRaw} L${endX} ${endYRaw} L${startX} ${endYRaw} L${startX} ${startYRaw}`
}

const SUBTITLES_CHUNK_HEIGHT = 24

const SubtitlesChunk = ({ chunk, trackIndex, chunkIndex, trackId }) => (
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
  ({ subtitles, viewBox, goToSubtitlesChunk }) => {
    const handleClick = useRef(e =>
      goToSubtitlesChunk(e.target.dataset.trackId, e.target.dataset.chunkIndex)
    )
    return (
      <svg
        className={css.subtitlesSvg}
        preserveAspectRatio="xMinYMin slice"
        viewBox={getSubtitlesViewBoxString(
          viewBox.xMin,
          subtitles.length * SUBTITLES_CHUNK_HEIGHT
        )}
        width="100%"
        height={subtitles.length * SUBTITLES_CHUNK_HEIGHT}
        onClick={handleClick.current}
      >
        {subtitles.map(({ chunks, id }, trackIndex) =>
          chunks.map((chunk, index) => (
            <SubtitlesChunk
              key={chunk.id}
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

const Waveform = ({
  show,
  clips,
  pendingClip,
  pendingStretch,
  highlightedClipId,
  waveform,
  path,
  subtitles,
  goToSubtitlesChunk,
}) => {
  const { viewBox, cursor, stepsPerSecond } = waveform
  const viewBoxString = getViewBoxString(viewBox.xMin)
  const svgRef = useRef(null)
  const onMouseDown = useCallback(
    e =>
      document.dispatchEvent(
        new WaveformMousedownEvent(
          e.currentTarget,
          toWaveformCoordinates(e, e.currentTarget, waveform.viewBox.xMin)
        )
      ),
    [waveform.viewBox.xMin]
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

const mapStateToProps = state => ({
  waveform: r.getWaveform(state),
  path: r.getWaveformPath(state),
  clips: r.getCurrentFileClips(state),
  pendingClip: r.getPendingClip(state),
  pendingStretch: r.getPendingStretch(state),
  highlightedClipId: r.getHighlightedClipId(state),
  subtitles: r.getSubtitlesTracks(state),
})
const mapDispatchToProps = {
  highlightClip: r.highlightClip,
  goToSubtitlesChunk: r.goToSubtitlesChunk,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Waveform)
