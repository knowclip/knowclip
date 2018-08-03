import React from 'react'

import getWaveformViewbox from '../utils/getWaveformViewbox'

const Waveform = ({ path }) =>
  <svg viewBox={getWaveformViewbox()} preserveAspectRatio="none" className="waveform-svg">
    <g className="waveform-g">
      <path className="waveform-path" d={path}/>
    </g>
  </svg>

export default Waveform
