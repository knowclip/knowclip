const toWaveformXRaw = (
  mouseEvent: MouseEvent,
  svgElement: SVGElement,
  xMin = 0
) => mouseEvent.clientX - svgElement.getBoundingClientRect().left + xMin

export const toWaveformX =
  process.env.NODE_ENV === 'development' && process.env.REACT_APP_SPECTRON
    ? (mouseEvent: MouseEvent, svgElement: SVGElement, xMin = 0) => {
        const x = toWaveformXRaw(mouseEvent, svgElement, xMin)
        console.log(mouseEvent.type, mouseEvent)
        return x
      }
    : toWaveformXRaw

export const toWaveformCoordinates = (
  mouseEvent: MouseEvent,
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

export const getSecondsAtXFromWaveform = (
  { stepsPerSecond, stepLength }: WaveformState,
  x: number
): number => +(x / (stepsPerSecond * stepLength)).toFixed(5)

export const getXAtMillisecondsFromWaveform = (
  { stepsPerSecond, stepLength }: WaveformState,
  milliseconds: number
): number => +((milliseconds / 1000) * (stepsPerSecond * stepLength)).toFixed(2)
