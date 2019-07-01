// @flow

export const toWaveformX = (
  mouseEvent: MouseEvent,
  svgElement: HTMLElement,
  xMin: number = 0
) => mouseEvent.clientX - svgElement.getBoundingClientRect().left + xMin

export const toWaveformCoordinates = (
  mouseEvent: MouseEvent,
  svgElement: HTMLElement,
  xMin: number = 0
) => {
  const { clientX, clientY } = mouseEvent
  const { left, top } = svgElement.getBoundingClientRect()
  return {
    x: clientX - left + xMin,
    // x: +(clientX - left + xMin).toFixed(2),
    y: clientY - top,
  }
}
