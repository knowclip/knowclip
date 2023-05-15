import { ipcRenderer } from 'electron'
import moment from 'moment'
import { join } from 'path'
import { promises } from 'fs'
import { sendToMainProcess } from './sendToMainProcess'
import { getPersistedDataSnapshot } from '../test/getPersistedDataSnapshot'
import { writeFileSync } from './fs'

type ModuleLike = { [name: string]: (...args: any) => any }

type MockedModule<M extends ModuleLike> = { -readonly [K in keyof M]: M[K] }
const mocking =
  process.env.NODE_ENV === 'integration' ||
  process.env.NODE_ENV === 'integrationDev'

const mockedModules: Record<
  string,
  {
    logged: { [fnName: string]: any[] }
    returnValues: { [fnName: string]: any[] }
  }
> = {}

let currentTestId = ''

const now = moment.utc().format()
const logFilePath = (moduleId: string) =>
  join(
    process.cwd(),
    `${currentTestId && currentTestId + '__'}${moduleId}-mocks-${now}.log`
  )
const writeLog = (moduleId: string, logged: { [fnName: string]: any[] }) =>
  promises.writeFile(logFilePath(moduleId), JSON.stringify(logged, null, 2))

export function listenToTestIpcEvents() {
  console.log('Going to start listening for IPC test events!!')

  ipcRenderer.on('start-test', (e, testId) => {
    currentTestId = testId
  })
  ipcRenderer.on('end-test', () => {
    currentTestId = ''
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
      const snapshot = getPersistedDataSnapshot(getState(), testId, directories)

      console.log(snapshot)
      snapshot.keepTmpFiles()
      console.log(snapshot.json)

      writeFileSync(
        join(process.cwd(), testId + '_persistedDataSnapshot.js'),
        snapshot.json
      )
    })
  })
}

export function setUpMocks<M extends ModuleLike>(
  moduleId: string,
  actualModule: MockedModule<M>
): MockedModule<M> {
  if (!mocking) return actualModule

  console.log(`Preparing module ${moduleId} for mocking`)

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

    // @ts-expect-error
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

      writeLog(moduleId, logged)

      return actualReturnValue
    }
  }

  console.log(`Mocks after ${moduleId}`, mockedModules)
  return mockedModule
}

const deserializeReturnValue = ({
  isPromise,
  value,
}: {
  isPromise: boolean
  value: any
}) => (isPromise ? Promise.resolve(value) : value)
