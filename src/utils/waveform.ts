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

export const setCursorX = (x: number) => {
  const cursor: SVGLineElement | null = document.querySelector('.cursor')
  if (cursor) {
    const string = String(x)
    cursor.setAttribute('x1', string)
    cursor.setAttribute('x2', string)
  }
}

export const syncCursor = (pixelsPerSecond: number) => (_increment: number) => {
  const cursor: SVGLineElement | null = document.querySelector('.cursor')
  if (cursor) {
    const player = document.getElementById('mediaPlayer') as
      | HTMLVideoElement
      | HTMLAudioElement
      | null
    const string = player ? String(player.currentTime * pixelsPerSecond) : '0'
    cursor.setAttribute('x1', string)
    cursor.setAttribute('x2', string)
  }

  animationFrame = requestAnimationFrame(syncCursor(pixelsPerSecond))
}

let animationFrame: number

export const startMovingCursor = (pixelsPerSecond: number) => {
  animationFrame = requestAnimationFrame(syncCursor(pixelsPerSecond))
}

export const stopMovingCursor = () => {
  cancelAnimationFrame(animationFrame)
}
