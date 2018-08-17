import React from 'react'

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
  <line stroke="black" x1={x} y1="-1" x2={x} y2="100" />

const getSelectionPath = (startRaw, endRaw, stepsPerSecond) => {
  const start = startRaw * (stepsPerSecond / 2)
  const end = endRaw * (stepsPerSecond / 2)
  return `M${start} 0 L${end} 0 L${end} 100 L${start} 100 L${start} 0`
}

const Selection = ({ start, end, stepsPerSecond }) =>
  <path className="waveform-selection" d={getSelectionPath(start, end, stepsPerSecond)} />

const PendingSelection = ({ start, end, stepsPerSecond }) =>
  <path className="waveform-pending-selection" d={getSelectionPath(start, end, stepsPerSecond)} />


const Waveform = ({ peaks, viewbox, cursor, svgRef, selections, pendingSelection, stepsPerSecond, stepLength }) =>
  <svg
    ref={svgRef}
    viewBox="0 0 100% 100"
    preserveAspectRatio="meet"
    className="waveform-svg"
    width="100%"
    height="100"
    shapeRendering="optimizeSpeed"
  >
    <g className="waveform-g">
      <path className="waveform-path" d={getSvgPath(peaks, stepLength)}/>
      <Cursor {...cursor} />
      {selections.map(selection => <Selection {...selection} stepsPerSecond={stepsPerSecond} />)}
      {pendingSelection && <PendingSelection {...pendingSelection} stepsPerSecond={stepsPerSecond} />}
    </g>
  </svg>

export default Waveform
