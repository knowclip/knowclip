import React, { Component, Fragment, memo } from 'react'
import cn from 'classnames'
import { connect } from 'react-redux'
import * as r from '../redux'
import css from './Waveform.module.css'

const { SELECTION_BORDER_WIDTH } = r

const Cursor = ({ x, y }) => (
  // null
  <line
    stroke="black"
    x1={x}
    y1="-1"
    x2={x}
    y2="100"
    shapeRendering="crispEdges"
  />
)

const getClipPath = (startRaw, endRaw, stepsPerSecond) => {
  const start = startRaw
  const end = endRaw
  return `M${start} 0 L${end} 0 L${end} 100 L${start} 100 L${start} 0`
}

const Clip = ({ id, start, end, stepsPerSecond, isHighlighted, flashcard }) => {
  return (
    <g id={id}>
      <path
        className={cn('waveform-clip', { isHighlighted })}
        d={getClipPath(start, end, stepsPerSecond)}
      />
      {/*<text x={start} y={90} width={end - start}>{Object.values(flashcard.fields)[0]}</text>*/}
      <rect
        className="waveform-clip-border"
        x={start}
        y="0"
        width={SELECTION_BORDER_WIDTH}
        height="100"
      />
      <rect
        className="waveform-clip-border"
        x={end - SELECTION_BORDER_WIDTH}
        y="0"
        width={SELECTION_BORDER_WIDTH}
        height="100"
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

const getViewBoxString = xMin => `${xMin} 0 3000 100`
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

const SubtitlesChunk = ({ chunk, trackIndex }) => (
  <g className={css.subtitlesChunk}>
    <path
      className={css.subtitlesChunkRectangle}
      d={getSubtitlesPath(
        chunk.start,
        chunk.end,
        trackIndex * SUBTITLES_CHUNK_HEIGHT,
        (trackIndex + 1) * SUBTITLES_CHUNK_HEIGHT
      )}
    />
    <text
      className={css.subtitlesText}
      x={chunk.start + 4}
      y={(trackIndex + 1) * SUBTITLES_CHUNK_HEIGHT - 4}
      width={(trackIndex + 1) * SUBTITLES_CHUNK_HEIGHT - chunk.start}
    >
      {chunk.text}
    </text>
  </g>
)

const SubtitlesTimeline = memo(({ subtitles, viewBox }) => (
  <svg
    className={css.subtitlesSvg}
    preserveAspectRatio="xMinYMin slice"
    viewBox={getSubtitlesViewBoxString(
      viewBox.xMin,
      subtitles.length * SUBTITLES_CHUNK_HEIGHT
    )}
    width="100%"
    height={subtitles.length * SUBTITLES_CHUNK_HEIGHT}
  >
    {subtitles.map(({ chunks }, i) =>
      chunks.map(chunk => <SubtitlesChunk chunk={chunk} trackIndex={i} />)
    )}
  </svg>
))

class Waveform extends Component {
  render() {
    const {
      show,
      clips,
      pendingClip,
      pendingStretch,
      highlightedClipId,
      waveform,
      subtitles,
    } = this.props
    const { viewBox, cursor, stepsPerSecond, path } = waveform
    const viewBoxString = getViewBoxString(viewBox.xMin)
    return (
      <Fragment>
        <svg
          style={show ? {} : { display: 'none' }}
          id="waveform-svg"
          viewBox={viewBoxString}
          preserveAspectRatio="xMinYMin slice"
          className="waveform-svg"
          width="100%"
          height="100"
        >
          {path && <image xlinkHref={`file://${path}`} />}
          <Cursor {...cursor} />
          <Clips {...{ clips, highlightedClipId, stepsPerSecond }} />
          {pendingClip && (
            <PendingClip {...pendingClip} stepsPerSecond={stepsPerSecond} />
          )}
          {pendingStretch && (
            <PendingStretch
              {...pendingStretch}
              stepsPerSecond={stepsPerSecond}
            />
          )}
        </svg>
        {Boolean(subtitles.length) && (
          <SubtitlesTimeline subtitles={subtitles} viewBox={viewBox} />
        )}
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({
  waveform: r.getWaveform(state),
  clips: r.getCurrentFileClips(state),
  pendingClip: r.getPendingClip(state),
  pendingStretch: r.getPendingStretch(state),
  highlightedClipId: r.getHighlightedClipId(state),
  subtitles: r.getSubtitlesTracks(state),
})

export default connect(
  mapStateToProps,
  { highlightClip: r.highlightClip }
)(Waveform)
