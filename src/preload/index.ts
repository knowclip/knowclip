import * as electron from './electron'
import * as os from './os'
import * as path from './path'
import * as fs from './fs'
import * as fsExtra from './fsExtra'
import * as tempy from './tempy'
import * as ffmpeg from './ffmpeg'
import * as yauzl from './yauzl'
import { processNoteMedia } from './processNoteMedia'
import * as writeToApkg from './writeToApkg'

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}

export type ElectronApi = typeof electronApi

const electronApi = {
  electron,
  os,
  path,
  fs,
  fsExtra,
  tempy,
  ffmpeg,
  yauzl,
  processNoteMedia,
  writeToApkg,
}

global.window.electronApi = electronApi
