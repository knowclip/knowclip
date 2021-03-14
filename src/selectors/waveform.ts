export const WAVEFORM_HEIGHT = 70
export const SELECTION_BORDER_MILLISECONDS = 100
export const CLIP_THRESHOLD_MILLSECONDS = 800 // should be in ms
export const SUBTITLES_CHUNK_HEIGHT = 14
export const DEFAULT_PIXELS_PER_SECOND = 50

export const msToSeconds = (ms: number) => +(ms / 1000).toFixed(5)
export const secondsToMs = (s: number) => Math.round(s * 1000)

export const msToPixels = (ms: number, pps: number) => (ms / 1000) * pps
export const secondsToPixels = (s: number, pps: number) =>
  msToPixels(s * 1000, pps)
export const pixelsToMs = (pixels: number, pps: number) =>
  Math.round((pixels / pps) * 1000)
export const pixelsToSeconds = (pixels: number, pps: number) =>
  msToSeconds(pixelsToMs(pixels, pps))
