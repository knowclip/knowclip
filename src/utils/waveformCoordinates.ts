import * as React from 'react'
import { pixelsToMs } from 'clipwave'
import { VITE_INTEGRATION_DEV } from '../env'

// TODO: FIX like below
const toWaveformXRaw = (
  mouseEvent: React.MouseEvent<SVGElement> | MouseEvent,
  svgElement: SVGElement,
  xMin = 0
) => mouseEvent.clientX - svgElement.getBoundingClientRect().left + xMin

export const toWaveformX = VITE_INTEGRATION_DEV
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

export const waveformTimeAtMousePosition = (
  mouseEvent: React.MouseEvent<SVGElement> | MouseEvent,
  svgElement: SVGElement,

  viewBoxStartMs: number,
  pixelsPerSecond: number
) => {
  const { clientX } = mouseEvent
  const { left } = svgElement.getBoundingClientRect()

  const offsetX = clientX - left
  return pixelsToMs(offsetX, pixelsPerSecond) + viewBoxStartMs
}
