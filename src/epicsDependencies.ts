import { fromEvent } from 'rxjs'
import { getMediaMetadata } from 'preloaded/ffmpeg'
import { sendClosedSignal } from 'preloaded/electron'
import { getVideoStill } from 'preloaded/getVideoStill'
import * as tempy from 'preloaded/tempy'
import { sendToMainProcess } from 'preloaded/sendToMainProcess'
import { processNoteMedia } from 'preloaded/processNoteMedia'
import { getSubtitlesFromFile, getSubtitlesFilePath } from './utils/subtitles'
import { getWaveformPng } from './utils/getWaveform'
import { coerceMp3ToConstantBitrate as getConstantBitrateMediaPath } from './utils/constantBitrateMp3'
import { nowUtcTimestamp, uuid } from './utils/sideEffects'
import { getDexieDb } from './utils/dictionariesDatabase'
import { parseAndImportDictionary } from './utils/dictionaries/parseAndImportDictionary'
import * as electronHelpers from './utils/electron'
import * as mediaHelpers from './utils/media'
import { ClipwaveCallbackEvent, WaveformInterface } from 'clipwave'
import { CLIPWAVE_ID } from './utils/clipwave'
import { existsSync, writeFile } from 'preloaded/fs'
import { flushSync } from 'react-dom'

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
    fromEvent(window, `ipc:${eventName}`),
  sendToMainProcess,
  quitApp: () => sendClosedSignal(),
  tmpDirectory: () => tempy.temporaryDirectory(),
  tmpFilename: () => tempy.temporaryFile(),

  dispatchClipwaveEvent: (callback: (waveform: WaveformInterface) => void) => {
    window.dispatchEvent(
      new ClipwaveCallbackEvent(CLIPWAVE_ID, (waveform: WaveformInterface) =>
        flushSync(() => callback(waveform))
      )
    )
  },
}

export default dependencies

export type EpicsDependencies = typeof dependencies
