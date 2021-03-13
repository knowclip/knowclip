import * as React from 'react'

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
  xMin = 0
) => {
  const { clientX, clientY } = mouseEvent
  const { left, top } = svgElement.getBoundingClientRect()

  return {
    x: clientX - left + xMin,
    // x: +(clientX - left + xMin).toFixed(2),
    y: clientY - top,
  }
}
const TEMP_FACTOR = 25

export const getSecondsAtXFromWaveform = (x: number): number =>
  +(x / TEMP_FACTOR).toFixed(5)

export const getXAtMillisecondsFromWaveform = (milliseconds: number): number =>
  +((milliseconds / 1000) * TEMP_FACTOR).toFixed(2)
