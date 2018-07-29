import React from 'react'

const Waveform = ({ path }) =>
  <svg viewBox="0 -1 100 2" preserveAspectRatio="none" className="waveform-svg">
    <g className="waveform-g">
      <path className="waveform-path" d={path}/>
    </g>
  </svg>

export default Waveform
