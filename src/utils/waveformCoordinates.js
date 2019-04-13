export const toWaveformX = (mouseEvent, svgElement, xMin = 0) =>
  mouseEvent.clientX - svgElement.getBoundingClientRect().left + xMin

export const toWaveformCoordinates = (mouseEvent, svgElement, xMin = 0) => {
  const { clientX, clientY } = mouseEvent
  const { left, top } = svgElement.getBoundingClientRect()
  return {
    x: clientX - left + xMin,
    // x: +(clientX - left + xMin).toFixed(2),
    y: clientY - top,
  }
}
