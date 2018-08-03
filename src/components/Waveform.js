import React from 'react'

const Cursor = ({ x, y }) =>
  null
  // <line stroke="black" x1="0" y1="-1" x2="0" y2="1" />

const Waveform = ({ path, viewbox, cursor }) =>
  <svg viewBox={viewbox} preserveAspectRatio="none" className="waveform-svg">
    <g className="waveform-g">
      <path className="waveform-path" d={path}/>
      <Cursor {...cursor} />
    </g>
  </svg>

export default Waveform
