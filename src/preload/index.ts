import { contextBridge, ipcRenderer } from 'electron'

console.log('Beginning preload')

import { exposeConf } from 'electron-conf/preload'
if (!process.env.VITEST) exposeConf()

import { sendToMainProcess } from '../node/sendToMainProcess'
import type {
  MessageHandlerResult,
  MessageResponse,
  MessageToMain,
  MessageToMainType,
} from '../MessageToMain'
import { setUpMocks } from '../node/setUpMocks'

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}

export type ElectronApi = typeof electronApi

const env = process.env

console.log('import meta env', import.meta.env)
console.log('process.env', process.env)

const mockedModules: Record<
  string,
  {
    logged: { [fnName: string]: any[] }
    returnValues: { [fnName: string]: any[] }
  }
> = {}

const electronApi = {
  setUpMocks: setUpMocks,
  platform: process.platform,
  openExternal: (path: string) =>
    sendToMainProcess({
      type: 'openExternal',
      args: [path],
    }),
  sendToMainProcess: sendToMainProcess,
  sendClosedSignal: () => ipcRenderer.send('closed'),
  env: {
    VITEST: env.VITEST,
    TEST_ID: env.TEST_ID,
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
  mockedModules,
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

function listenToTestIpcEvents() {
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
      const { returnValues } = mockedModules[moduleId]

      console.log(
        `Function ${functionName} mocked with: ${JSON.stringify(
          newReturnValue
        )}`
      )
      returnValues[functionName].push(deserializeReturnValue(newReturnValue))
      if (process.env.VITE_INTEGRATION_DEV)
        sendToMainProcess({
          type: 'log',
          args: [
            `\n\n\nFunction ${functionName} mocked with: ${JSON.stringify(
              newReturnValue
            )}\n\n\n`,
          ],
        })
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

console.log('done preloading')
