import { contextBridge, ipcRenderer } from 'electron'

console.log('Beginning preload')

import { exposeConf } from 'electron-conf/preload'
if (!process.env.VITEST) exposeConf()

import { sendToMainProcess } from './sendToMainProcess'
import type {
  MessageHandlerResult,
  MessageResponse,
  MessageToMain,
  MessageToMainType,
} from '../MessageToMain'
import type { MockedModule } from './setUpMocks'

declare global {
  interface Window {
    electronApi: ElectronApi
    mockedModules: Record<string, MockedModule<any>>
  }
}

export type ElectronApi = typeof electronApi

console.log('import meta env', import.meta.env)
console.log('process.env', process.env)
process.argv.forEach((val, index) => {
  console.log(`argv ${index}: ${val}`)
})

const knowclipServerIp = process.argv
  .find((arg) => arg.includes('--kc-ip='))
  ?.split('=')[1]
const knowclipServerPort = process.argv
  .find((arg) => arg.includes('--kc-port='))
  ?.split('=')[1]

const knowclipServerAddress = `http://${knowclipServerIp}:${knowclipServerPort}`

const platform = process.platform as 'darwin' | 'win32' | 'linux'

const electronApi = {
  platform,
  knowclipServerAddress,
  openExternal: (path: string) =>
    sendToMainProcess({
      type: 'openExternal',
      args: [path],
    }),
  sendToMainProcess: sendToMainProcess,
  sendClosedSignal: () => ipcRenderer.send('closed'),
  env: {
    VITEST: process.env.VITEST ?? import.meta.env.VITEST,
    TEST_ID: process.env.TEST_ID ?? import.meta.env.TEST_ID,
    VITE_BUILD_NUMBER:
      process.env.VITE_BUILD_NUMBER ?? import.meta.env.VITE_BUILD_NUMBER,
    DEV: process.env.DEV ?? import.meta.env.DEV,
    VITE_INTEGRATION_DEV:
      process.env.VITE_INTEGRATION_DEV ?? import.meta.env.VITE_INTEGRATION_DEV,
    NODE_ENV: process.env.NODE_ENV ?? import.meta.env.NODE_ENV,
    PERSISTED_STATE_PATH:
      process.env.PERSISTED_STATE_PATH ?? import.meta.env.PERSISTED_STATE_PATH,
  },

  invokeMessage: <T extends MessageToMainType>(
    message: MessageToMain<T>
  ): Promise<MessageResponse<Awaited<MessageHandlerResult<T>>>> => {
    return ipcRenderer.invoke('message', message)
  },
  close: () => {
    return ipcRenderer.invoke('close')
  },
  listenToTestIpcEvents: listenToTestIpcEvents,
  listenToLogPersistedDataEvents(getState: () => AppState) {
    window.document.addEventListener('DOMContentLoaded', () => {
      console.log('listening for log message')
      ipcRenderer.on('log-persisted-data', (e, testId, directories) => {
        // TODO: test!!
        window.electronApi.logPersistedDataSnapshot(
          testId,
          directories,
          getState()
        )
      })
    })
  },
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

function listenToTestIpcEvents(
  callback: (
    moduleId: string,
    functionName: string,
    newReturnValue: string,
    deserializedReturnValue: any
  ) => void
) {
  console.log('Going to start listening for IPC test events!!')

  ipcRenderer.on('start-test', (e, testId) => {
    console.log('Test started', testId)
  })
  ipcRenderer.on('end-test', (testId) => {
    console.log('Test ended', testId)
  })

  ipcRenderer.on(
    'mock-function',
    (event, moduleId, functionName, newReturnValue) => {
      console.log(
        `Function ${functionName} mocked with: ${JSON.stringify(
          newReturnValue
        )}`
      )
      const deserializedReturnValue = deserializeReturnValue(newReturnValue)
      callback(moduleId, functionName, newReturnValue, deserializedReturnValue)
    }
  )
}

function deserializeReturnValue({
  isPromise,
  value,
}: {
  isPromise: boolean
  value: any
}) {
  return isPromise ? Promise.resolve(value) : value
}

if (!knowclipServerIp) {
  throw new Error('knowclipServerAddress not provided')
}
if (platform !== 'darwin' && platform !== 'win32' && platform !== 'linux') {
  throw new Error(`Unsupported platform ${platform}`)
}

console.log('done preloading')
