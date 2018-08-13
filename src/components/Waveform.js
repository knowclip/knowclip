import React from 'react'

const Cursor = ({ x, y }) =>
  // null
  <line stroke="black" x1={x} y1="-1" x2={x} y2="1" />

const getSelectionPath = (start, end) =>
  `M${start} 0 L${end} 0 L${end} 2 L${start} 2 L${start} 0`

const Selection = ({ start, end }) =>
  <path className="waveform-selection" d={getSelectionPath(start, end)} />

const PendingSelection = ({ start, end }) =>
  <path className="waveform-pending-selection" d={getSelectionPath(start, end)} />


const Waveform = ({ path, viewbox, cursor, svgRef, selections, pendingSelection }) =>
  <svg ref={svgRef} viewBox={viewbox} preserveAspectRatio="none" className="waveform-svg">
    <g className="waveform-g">
      <path className="waveform-path" d={path}/>
      <Cursor {...cursor} />
      {selections.map(selection => <Selection {...selection} />)}
      {pendingSelection && <PendingSelection {...pendingSelection} />}
    </g>
  </svg>

export default Waveform
