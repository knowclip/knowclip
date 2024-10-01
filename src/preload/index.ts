import { contextBridge, ipcRenderer } from 'electron'

console.log('Beginning preload')

// import 'path'
import {
  setUpMocks,
  listenToTestIpcEvents,
  listenToLogPersistedDataEvents,
} from '../node/setUpMocks'
import { sendToMainProcess } from '../node/sendToMainProcess'
import type {
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
  platform: process.platform,
  openExternal: (path: string) =>
    sendToMainProcess({
      type: 'openExternal',
      args: [path],
    }),
  sendToMainProcess: sendToMainProcess,
  setUpMocks: setUpMocks,
  sendClosedSignal: () => ipcRenderer.send('closed'),
  env: {
    VITEST: env.VITEST,
    BUILD_NUMBER: env.BUILD_NUMBER,
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
  listenToIpcRendererMessages,
  writeTextFile: (path: string, data: string) => {
    sendToMainProcess({
      type: 'writeTextFile',
      args: [path, data],
    })
  },
  logPersistedDataSnapshot: (
    testId: string,
    directories: Record<string, string>,
    state: AppState
  ) => {
    sendToMainProcess({
      type: 'logPersistedDataSnapshot',
      args: [testId, directories, state],
    })
  },
  writeMocksLog: (
    testId: string,
    moduleId: string,
    logged: { [key: string]: any[] }
  ) => {
    sendToMainProcess({
      type: 'writeMocksLog',
      args: [testId, moduleId, logged],
    })
  },
}

console.log('preloading')

// sendToMainProcess({
//   type: 'getFfmpegAndFfprobePath',
//   args: [],
// }).then((getPaths) => {
//   if (getPaths.errors) {
//     console.error(getPaths.errors)
//     throw new Error('Problem finding ffmpeg and ffprobe paths.')
//   } else {
//     console.log('setting ffprobe paths', getPaths.value)
//   }
//   ffmpeg.ffmpeg.setFfmpegPath(getPaths.value.ffmpeg)
//   ffmpeg.ffmpeg.setFfprobePath(getPaths.value.ffprobe)
// })

contextBridge.exposeInMainWorld('electronApi', electronApi)

function listenToIpcRendererMessages(
  callback: (
    event: Electron.IpcRendererEvent,
    message: string,
    payload: string
  ) => void
) {
  ipcRenderer.on('message', callback)
}

console.log('preloaded')
