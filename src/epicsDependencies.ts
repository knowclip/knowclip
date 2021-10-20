import { ipcRenderer } from 'electron'
import { fromEvent } from 'rxjs'
import * as fs from 'fs'
import { getMediaMetadata } from './utils/ffmpeg'
import { getSubtitlesFromFile, getSubtitlesFilePath } from './utils/subtitles'
import { getWaveformPng } from './utils/getWaveform'
import { getVideoStill } from './utils/getVideoStill'
import { coerceMp3ToConstantBitrate as getConstantBitrateMediaPath } from './utils/constantBitrateMp3'
import tempy from 'tempy'
import { nowUtcTimestamp, uuid } from './utils/sideEffects'
import { getDexieDb } from './utils/dictionariesDatabase'
import { parseAndImportDictionary } from './utils/dictionaries/parseAndImportDictionary'
import * as electronHelpers from './utils/electron'
import * as mediaHelpers from './utils/media'
import { sendToMainProcess } from './messages'
import { processNoteMedia } from './utils/ankiNote'
import { callbackify } from 'util'
import { ClipwaveRegionsUpdateEvent, WaveformInterface } from 'clipwave'
import { CLIPWAVE_ID } from './utils/clipwave'

const {
  existsSync,
  createWriteStream,
  promises: { writeFile },
} = fs

const fsDependencies = { existsSync, createWriteStream, writeFile }

const dependencies = {
  ...electronHelpers,
  ...fsDependencies,
  document,
  window,

  ...mediaHelpers,

  getMediaMetadata,
  getSubtitlesFromFile,
  getSubtitlesFilePath,
  getWaveformPng,
  getVideoStill,
  getConstantBitrateMediaPath,
  processNoteMedia,
  nowUtcTimestamp,
  uuid,
  getDexieDb,

  parseAndImportDictionary,
  fromIpcRendererEvent: (eventName: string) =>
    fromEvent(ipcRenderer, eventName),
  sendToMainProcess,
  quitApp: () => ipcRenderer.send('closed'),
  tmpDirectory: () => tempy.directory(),
  tmpFilename: () => tempy.file(),

  dispatchClipwaveEvent: (
    callback: (waveform: WaveformInterface) => void
  ) => {
    window.dispatchEvent(new ClipwaveRegionsUpdateEvent(CLIPWAVE_ID, callback))
  },
}

export default dependencies

export type EpicsDependencies = typeof dependencies
