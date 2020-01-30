import { getMediaMetadata } from './utils/ffmpeg'
import { getSubtitlesFromFile, getSubtitlesFilePath } from './utils/subtitles'
import { existsSync } from 'fs'
import { getWaveformPng } from './utils/getWaveform'
import { getVideoStill } from './utils/getVideoStill'
import { coerceMp3ToConstantBitrate as getConstantBitrateMediaPath } from './utils/constantBitrateMp3'
import { remote, ipcRenderer } from 'electron'
import { nowUtcTimestamp } from './utils/sideEffects'

const elementWidth = (element: Element) => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}
const getMediaPlayer = () =>
  document.getElementById('mediaPlayer') as
    | HTMLAudioElement
    | HTMLVideoElement
    | null

const getWaveformSvgElement = () =>
  (document.getElementById('waveform-svg') as SVGElement | null) || null

const dependencies: EpicsDependencies = {
  document,
  window,
  getCurrentWindow: () => remote.getCurrentWindow(),
  setLocalStorage: (key, value) => window.localStorage.setItem(key, value),
  getLocalStorage: key => window.localStorage.getItem(key),
  getWaveformSvgElement,
  getWaveformSvgWidth: () => {
    const el = getWaveformSvgElement()
    return el ? elementWidth(el) : 0
  },
  setCurrentTime: (time: number) => {
    const media = getMediaPlayer()
    if (media) {
      media.currentTime = time
    }
  },
  getCurrentTime: () => {
    const media = getMediaPlayer()
    return media ? media.currentTime : 0
  },
  pauseMedia: () => {
    const el = getMediaPlayer()
    if (el) {
      el.pause()
    }
  },
  playMedia: () => {
    const el = getMediaPlayer()
    if (el) {
      el.play()
    }
  },
  toggleMediaPaused: () => {
    const el = getMediaPlayer()
    if (!el) return
    if (el.paused) el.play()
    else el.pause()
  },
  isMediaPlaying: () => {
    const el = getMediaPlayer()
    if (!el) return false
    return !el.paused
  },
  getMediaMetadata,
  getSubtitlesFromFile,
  getSubtitlesFilePath,
  getWaveformPng,
  getVideoStill,
  getConstantBitrateMediaPath,
  existsSync,
  ipcRenderer,
  nowUtcTimestamp,
}
export default dependencies
