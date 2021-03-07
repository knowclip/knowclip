import {  ipcRenderer } from 'electron'
import { fromEvent } from 'rxjs'
import { getMediaMetadata } from './utils/ffmpeg'
import { getSubtitlesFromFile, getSubtitlesFilePath } from './utils/subtitles'
import { getWaveformPng } from './utils/getWaveform'
import { getVideoStill } from './utils/getVideoStill'
import { coerceMp3ToConstantBitrate as getConstantBitrateMediaPath } from './utils/constantBitrateMp3'
import { nowUtcTimestamp } from './utils/sideEffects'
import { getDexieDb } from './utils/dictionariesDatabase'
import { parseAndImportDictionary } from './utils/dictionaries/parseAndImportDictionary'
import * as electron from './utils/electron'
import { sendToMainProcess } from './messages'

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

export const pauseMedia = () => {
  const el = getMediaPlayer()
  if (el) {
    el.pause()
  }
}

const dependencies = {
  document,
  window,
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
  pauseMedia,
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
  nowUtcTimestamp,
  getDexieDb,
  electron,
  parseAndImportDictionary,
  fromIpcRendererEvent: (eventName: string) =>
    fromEvent(ipcRenderer, eventName),
  sendToMainProcess,
  quitApp: () => ipcRenderer.send('closed'),
}

export default dependencies

export type EpicsDependencies = typeof dependencies
