export const WAVEFORM_HEIGHT = 70
export const SELECTION_BORDER_WIDTH = 5
export const CLIP_THRESHOLD = 40 // should be in ms
export const SUBTITLES_CHUNK_HEIGHT = 14
export const PIXELS_PER_SECOND = 25

export const msToPixels = (ms: number) => (ms / 1000) * PIXELS_PER_SECOND
export const secondsToPixels = (s: number) => msToPixels(s * 1000)
export const msToSeconds = (ms: number) => +(ms / 1000).toFixed(5)

export const pixelsToMs = (pixels: number) =>
  (pixels / PIXELS_PER_SECOND) * 1000
export const pixelsToSeconds = (pixels: number) =>
  msToSeconds(pixelsToMs(pixels))
