import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as r from '../redux'

// should actually just store peaks in redux, not path
// then getSvgPath will be a memoized? selector,
//   taking peaks plus "camera" and "zoom"

const WAVEFORM_HEIGHT = 50

export function getSvgPath(peaks, stepLength) {
  const totalPeaks = peaks.length
  let d = ''
  for (let peakNumber = 0; peakNumber < totalPeaks; peakNumber++) {
    if (peakNumber % 2 === 0) {
      d += ` M${~~(peakNumber / 2) * stepLength}, ${peaks[peakNumber] * WAVEFORM_HEIGHT + WAVEFORM_HEIGHT}`
    } else {
      d += ` L${~~(peakNumber / 2) * stepLength}, ${peaks[peakNumber] * WAVEFORM_HEIGHT + WAVEFORM_HEIGHT}`
    }
  }
  return d;
}


const Cursor = ({ x, y }) =>
  // null
  <line stroke="black" x1={x} y1="-1" x2={x} y2="100" shapeRendering="crispEdges" />

const getSelectionPath = (startRaw, endRaw, stepsPerSecond) => {
  const start = startRaw
  const end = endRaw
  return `M${start} 0 L${end} 0 L${end} 100 L${start} 100 L${start} 0`
}

const Selection = ({ id, start, end, stepsPerSecond }) =>
  <path className="waveform-selection" id={id} d={getSelectionPath(start, end, stepsPerSecond)} />

const PendingSelection = ({ start, end, stepsPerSecond }) =>
  <path className="waveform-pending-selection" d={getSelectionPath(start, end, stepsPerSecond)} />

const getViewBox = (xMin) => `${xMin} 0 3000 100`

const handleClick = (e) => {
  console.log('boops')
  if (e.target.classList.contains('waveform-selection')) console.log('balection!')
}

class Waveform extends Component {
  handleClickSelection = (e) => {
      console.log('balection!')
      // this.props.highlightSelection(e.target.id)
      // e.stopPropagation()
  }

  render() {
    const { peaks, viewBox, cursor, svgRef, selections, pendingSelection, stepsPerSecond, stepLength } = this.props
    return <svg
      ref={svgRef}
      viewBox={getViewBox(viewBox.xMin)}
      preserveAspectRatio="xMinYMin slice"
      className="waveform-svg"
      width="100%"
      height="100"
    >
      <g className="waveform-g">
        <path className="waveform-path" d={getSvgPath(peaks, stepLength)} shapeRendering="crispEdges" />
      </g>
      <Cursor {...cursor} />
      <g className="waveform-selections" onClick={this.handleClickSelection}>
        {selections.map(selection => <Selection {...selection} stepsPerSecond={stepsPerSecond} />)}
      </g>
      {pendingSelection && <PendingSelection {...pendingSelection} stepsPerSecond={stepsPerSecond} />}
    </svg>
  }
}


const mapStateToProps = state => ({
  ...r.getWaveform(state),
})

export default connect(mapStateToProps, { highlightSelection: r.highlightSelection })(Waveform)
