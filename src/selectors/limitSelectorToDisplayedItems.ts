const MAX_WAVEFORM_VIEWPORT_WIDTH = 3000

export const limitSelectorToDisplayedItems = <T>(
  getStart: (item: T) => number
) => (waveformItems: T[], waveformViewBoxXMin: number) => {
  const result: T[] = []
  const xMax = waveformViewBoxXMin + MAX_WAVEFORM_VIEWPORT_WIDTH
  for (const waveformItem of waveformItems) {
    const itemStart = getStart(waveformItem)
    // TODO: speed this up with binary search maybe?
    if (itemStart >= waveformViewBoxXMin) {
      if (xMax >= itemStart) {
        result.push(waveformItem)
      } else {
        break
      }
    }
  }
  return result
}
