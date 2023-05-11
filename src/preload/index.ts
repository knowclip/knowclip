import * as electron from './electron'
import { sendToMainProcess } from './sendToMainProcess'
import * as ffmpeg from './ffmpeg'
import { clipAudio } from './clipAudio'
import * as getVideoStill from './getVideoStill'
import * as os from './os'
import * as fs from './fs'
import * as path from './path'
import * as fsExtra from './fsExtra'
import * as tempy from './tempy'
import * as yauzl from './yauzl'
import { processNoteMedia } from './processNoteMedia'
import * as writeToApkg from './writeToApkg'
import { ipcRenderer } from 'electron'

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}

export type ElectronApi = typeof electronApi

const electronApi = {
  electron,
  sendToMainProcess,
  os,
  path,
  fs,
  fsExtra,
  tempy,
  ffmpeg,
  yauzl,
  processNoteMedia,
  getVideoStill,
  clipAudio,
  writeToApkg,
}

console.log('preloading')

global.window.electronApi = electronApi

ipcRenderer.on('message', (event, message) => {
  console.log('message sent', message)
  window.dispatchEvent(new Event(`ipc:${message}`))
})

console.log('preloaded')
