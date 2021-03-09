const elementWidth = (element: Element) => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}
export const getMediaPlayer = () =>
  document.getElementById('mediaPlayer') as
    | HTMLAudioElement
    | HTMLVideoElement
    | null

export const getWaveformSvgElement = () =>
  (document.getElementById('waveform-svg') as SVGElement | null) || null

export const pauseMedia = () => {
  const el = getMediaPlayer()
  if (el) {
    el.pause()
  }
}

export const getWaveformSvgWidth = () => {
  const el = getWaveformSvgElement()
  return el ? elementWidth(el) : 0
}

export const setCurrentTime = (time: number) => {
  const media = getMediaPlayer()
  if (media) {
    media.currentTime = time
  }
}

export const getCurrentTime = () => {
  const media = getMediaPlayer()
  return media ? media.currentTime : 0
}

export const playMedia = () => {
  const el = getMediaPlayer()
  if (el) {
    el.play()
  }
}

export const toggleMediaPaused = () => {
  const el = getMediaPlayer()
  if (!el) return
  if (el.paused) el.play()
  else el.pause()
}

export const isMediaPlaying = () => {
  const el = getMediaPlayer()
  if (!el) return false
  return !el.paused
}
