import { platform } from 'os'
import { basename, extname, dirname, resolve, join } from 'path'
import { promises, existsSync } from 'fs'

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}

export type ElectronApi = typeof electronApi

const electronApi = {
  os: { platform },
  path: { basename, extname, dirname, resolve, join },
  fs: { existsSync, readFile, writeFile },
}

global.window.electronApi = electronApi

function readFile(path: string) {
  return promises.readFile(path, 'utf8')
}

function writeFile(path: string, data: string) {
  return promises.writeFile(path, data)
}
