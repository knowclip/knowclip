import { ipcRenderer } from 'electron'
import { sendToMainProcess } from './sendToMainProcess'

type ModuleLike = { [name: string]: (...args: any) => any }

type MockedModule<M extends ModuleLike> = { -readonly [K in keyof M]: M[K] }
const mocking = process.env.NODE_ENV === 'integration'

const mockedModules: Record<
  string,
  {
    logged: { [fnName: string]: any[] }
    returnValues: { [fnName: string]: any[] }
  }
> = {}

let currentTestId: string = ''
export function listenToTestIpcEvents() {
  console.log('Going to start listening for IPC test events!!')

  ipcRenderer.on('start-test', (e, testId) => {
    currentTestId = testId
    console.log('Test started', testId)
  })
  ipcRenderer.on('end-test', () => {
    console.log('Test ended', currentTestId)
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

export function listenToLogPersistedDataEvents(getState: () => AppState) {
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
}

export function setUpMocks<M extends ModuleLike>(
  moduleId: string,
  actualModule: MockedModule<M>
): MockedModule<M> {
  if (!mocking) return actualModule

  const mockState = {
    logged: {} as { [K in keyof M]: ReturnType<M[K]>[] },
    returnValues: {} as { [K in keyof M]: ReturnType<M[K]>[] },
  }
  const { logged, returnValues } = mockState
  mockedModules[moduleId] = mockState

  const mockedModule = {} as MockedModule<M>

  for (const functionName in actualModule) {
    logged[functionName] = []
    returnValues[functionName] = []

    // @ts-expect-error arguments are going to match anyway
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    mockedModule[functionName] = (...args) => {
      if (returnValues[functionName].length) {
        const mockedReturnValue = returnValues[functionName].shift()!
        logged[functionName].push(mockedReturnValue)
        return mockedReturnValue
      }

      const actualReturnValue = actualModule[functionName](...args)

      console.log(`${moduleId}#${functionName} was not mocked`, {
        args,
        returnValue: actualReturnValue,
      })

      logged[functionName].push(actualReturnValue)

      window.electronApi.writeMocksLog(currentTestId, moduleId, logged)

      return actualReturnValue
    }
  }

  return mockedModule
}

const deserializeReturnValue = ({
  isPromise,
  value,
}: {
  isPromise: boolean
  value: any
}) => (isPromise ? Promise.resolve(value) : value)
