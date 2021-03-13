import * as React from 'react'
import { pixelsToMs } from '../selectors'

const toWaveformXRaw = (
  mouseEvent: React.MouseEvent<SVGElement> | MouseEvent,
  svgElement: SVGElement,
  xMin = 0
) => mouseEvent.clientX - svgElement.getBoundingClientRect().left + xMin

export const toWaveformX =
  process.env.NODE_ENV === 'development' && process.env.REACT_APP_CHROMEDRIVER
    ? (
        mouseEvent: React.MouseEvent<SVGElement> | MouseEvent,
        svgElement: SVGElement,
        xMin = 0
      ) => {
        const x = toWaveformXRaw(mouseEvent, svgElement, xMin)
        console.log(mouseEvent.type, mouseEvent.pageX, mouseEvent)
        return x
      }
    : toWaveformXRaw

export const toWaveformCoordinates = (
  mouseEvent: React.MouseEvent<SVGElement> | MouseEvent,
  svgElement: SVGElement,

  viewBoxStartMs = 0 // should be minTime
) => {
  const { clientX } = mouseEvent
  const { left } = svgElement.getBoundingClientRect()

  const offsetX = clientX - left
  return {
    ms: pixelsToMs(offsetX) + viewBoxStartMs,
    // x: +(clientX - left + xMin).toFixed(2),
  }
}

// export const getSecondsAtXFromWaveform = (x: number): number => // x / 1000
//   +(x / PIXELS_PER_SECOND).toFixed(5)
