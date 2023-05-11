import { ipcRenderer } from 'electron'
import { fromEvent } from 'rxjs'
import { getMediaMetadata } from './preload/ffmpeg'
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
import { processNoteMedia } from './preload/processNoteMedia'
import { ClipwaveCallbackEvent, WaveformInterface } from 'clipwave'
import { CLIPWAVE_ID } from './utils/clipwave'
import { existsSync, writeFile } from './preload/fs'

const dependencies = {
  ...electronHelpers,
  // fs
  writeFile: writeFile,
  existsSync: existsSync,

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

  dispatchClipwaveEvent: (callback: (waveform: WaveformInterface) => void) => {
    window.dispatchEvent(new ClipwaveCallbackEvent(CLIPWAVE_ID, callback))
  },
}

export default dependencies

export type EpicsDependencies = typeof dependencies
