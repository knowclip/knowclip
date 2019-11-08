import { getMediaMetadata } from './utils/ffmpeg'
import { getSubtitlesFromFile, getSubtitlesFromMedia } from './utils/subtitles'
import { existsSync } from 'fs'
import { getWaveformPng } from './utils/getWaveform'
import { coerceMp3ToConstantBitrate as getConstantBitrateMediaPath } from './epics/media'

const elementWidth = (element: Element) => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}
const getAudioElement = () => {
  const el = document.getElementById('audioPlayer')
  if (!(el instanceof HTMLAudioElement || el instanceof HTMLVideoElement))
    return null
  return el
}
const getWaveformSvgElement = () => document.getElementById('waveform-svg')

const dependencies: EpicsDependencies = {
  document,
  window,
  setLocalStorage: (key, value) => window.localStorage.setItem(key, value),
  getWaveformSvgElement: () =>
    (document.getElementById('waveform-svg') as SVGElement | null) || null,
  getWaveformSvgWidth: () => {
    const el = getWaveformSvgElement()
    return el ? elementWidth(el) : 0
  },
  setCurrentTime: (time: number) => {
    const media = getAudioElement()
    if (media) {
      media.currentTime = time
    }
  },
  getCurrentTime: () => {
    const media = getAudioElement()
    return media ? media.currentTime : 0
  },
  pauseMedia: () => {
    const el = getAudioElement()
    if (el) {
      el.pause()
    }
  },
  toggleMediaPaused: () => {
    const el = document.getElementById('audioPlayer')
    if (!(el instanceof HTMLAudioElement)) return
    if (el.paused) el.play()
    else el.pause()
  },
  getMediaMetadata,
  getSubtitlesFromFile,
  getSubtitlesFromMedia,
  getWaveformPng,
  getConstantBitrateMediaPath,
  existsSync,
}
export default dependencies
