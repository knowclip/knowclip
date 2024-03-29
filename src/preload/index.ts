import { contextBridge, ipcRenderer } from 'electron'
import {
  setUpMocks,
  listenToTestIpcEvents,
  listenToLogPersistedDataEvents,
} from '../node/setUpMocks'
import * as electron from '../node/electron'
import { sendToMainProcess } from '../node/sendToMainProcess'
import { initSentry } from '../node/initSentry'
import { clipAudio } from '../node/clipAudio'
import { createWaveformPng } from '../node/createWaveformPng'
import * as getVideoStill from '../node/getVideoStill'
import * as os from '../node/os'
import * as fs from '../node/fs'
import * as path from '../node/path'
import * as fsExtra from '../node/fsExtra'
import * as ffmpeg from '../node/ffmpeg'
import * as tempy from '../node/tempy'
import * as ajv from '../node/ajv'
import * as yauzl from '../node/yauzl'
import * as subtitle from '../node/subtitle'
import * as subsrt from '../node/subsrt'
import { processNoteMedia } from '../node/processNoteMedia'
import * as writeToApkg from '../node/writeToApkg'
import { createElectronStorage } from '../node/reduxPersistElectronStorage'
import {
  MessageHandlerResult,
  MessageResponse,
  MessageToMain,
  MessageToMainType,
} from '../MessageToMain'

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}

export type ElectronApi = typeof electronApi

const env = process.env

console.log('import meta env', import.meta.env)
console.log('process.env', process.env)

const electronApi = {
  electron,
  initSentry,
  createElectronStorage,
  sendToMainProcess,
  setUpMocks,
  os,
  path,
  fs,
  fsExtra,
  tempy,
  ajv,
  ffmpeg,
  yauzl,
  subtitle,
  subsrt,
  processNoteMedia,
  getVideoStill,
  clipAudio,
  createWaveformPng,
  writeToApkg,
  env: {
    VITEST: env.VITEST,
    VITE_BUILD_NUMBER: env.VITE_BUILD_NUMBER,
    DEV: env.DEV,
    VITE_INTEGRATION_DEV: env.VITE_INTEGRATION_DEV,
    NODE_ENV: env.NODE_ENV,
    PERSISTED_STATE_PATH: env.PERSISTED_STATE_PATH,
  },

  invokeMessage: <T extends MessageToMainType>(
    message: MessageToMain<T>
  ): Promise<MessageResponse<Awaited<MessageHandlerResult<T>>>> => {
    return ipcRenderer.invoke('message', message)
  },
  close: () => {
    return ipcRenderer.invoke('close')
  },
  listenToTestIpcEvents,
  listenToLogPersistedDataEvents,
}

console.log('preloading')

sendToMainProcess({
  type: 'getFfmpegAndFfprobePath',
  args: [],
}).then((getPaths) => {
  if (getPaths.error) {
    console.error(getPaths.error)
    throw new Error('Problem finding ffmpeg and ffprobe paths.')
  }
  ffmpeg.ffmpeg.setFfmpegPath(getPaths.result.ffmpeg)
  ffmpeg.ffmpeg.setFfprobePath(getPaths.result.ffprobe)
})

contextBridge.exposeInMainWorld('electronApi', electronApi)

ipcRenderer.on('message', (event, message) => {
  console.log('message sent', message)
  window.dispatchEvent(new Event(`ipc:${message}`))
})

console.log('preloaded')
