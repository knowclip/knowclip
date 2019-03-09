import React, { Component } from 'react'
import cn from 'classnames'
import { connect } from 'react-redux'
import * as r from '../redux'

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

const getViewBox = xMin => `${xMin} 0 3000 100`

class Waveform extends Component {
  render() {
    const {
      show,
      svgRef,
      clips,
      pendingClip,
      pendingStretch,
      highlightedClipId,
      waveform,
    } = this.props
    const { viewBox, cursor, stepsPerSecond, path } = waveform

    return (
      <svg
        style={show ? {} : { display: 'none' }}
        id="waveform-svg"
        ref={svgRef}
        viewBox={getViewBox(viewBox.xMin)}
        preserveAspectRatio="xMinYMin slice"
        className="waveform-svg"
        width="100%"
        height="100"
      >
        {path && <image xlinkHref={`file://${path}`} />}
        <Cursor {...cursor} />
        <g className="waveform-clips">
          {clips.map(clip => (
            <Clip
              {...clip}
              stepsPerSecond={stepsPerSecond}
              isHighlighted={clip.id === highlightedClipId}
            />
          ))}
        </g>
        {pendingClip && (
          <PendingClip {...pendingClip} stepsPerSecond={stepsPerSecond} />
        )}
        {pendingStretch && (
          <PendingStretch {...pendingStretch} stepsPerSecond={stepsPerSecond} />
        )}
      </svg>
    )
  }
}

const mapStateToProps = state => ({
  waveform: r.getWaveform(state),
  clips: r.getClips(state),
  pendingClip: r.getPendingClip(state),
  pendingStretch: r.getPendingStretch(state),
  highlightedClipId: r.getHighlightedClipId(state),
})

export default connect(
  mapStateToProps,
  { highlightClip: r.highlightClip }
)(Waveform)
