import { ipcRenderer } from 'electron'
import { promises } from 'fs'
import { join } from 'path'
import { TestDriver } from './driver/TestDriver'
import moment from 'moment'
import { sendToMainProcess } from '../preloaded/sendToMainProcess'

type ModuleLike = { [name: string]: (...args: any) => any }

type MockedModule<M extends ModuleLike> = { -readonly [K in keyof M]: M[K] }

const mockedModules: Record<string, SpectronMocks<ModuleLike>> = {}

type SpectronMocks<M extends ModuleLike> = {
  module: MockedModule<M>
  resetMocks: () => void
  mockFunctions: (
    app: TestDriver,
    mocks: Partial<{
      [K in keyof M]: ReturnType<M[K]>[]
    }>
  ) => Promise<void>
  logMocks: (app: TestDriver) => Promise<void>
}

export default function spectronMocks<M extends ModuleLike>(
  moduleId: string,
  actualModule: MockedModule<M>
): SpectronMocks<M> {
  const mocking =
    process.env.REACT_APP_CHROMEDRIVER || process.env.NODE_ENV === 'test'
  if (!mocking)
    return {
      module: actualModule,
      resetMocks,
      mockFunctions: async (_app, _mocks) => {
        throw new Error(
          `Can't mock in production environment. chromedriver: "${process.env.REACT_APP_CHROMEDRIVER}" node env: "${process.env.NODE_ENV}"`
        )
      },
      logMocks,
    }

  if (mockedModules[moduleId]) {
    console.log('Previously mocked: ' + moduleId)
    return mockedModules[moduleId] as SpectronMocks<M>
  }

  const now = moment.utc().format()
  let currentTestId = ''
  const logFilePath = () =>
    join(
      process.cwd(),
      `${currentTestId && currentTestId + '__'}${moduleId}-mocks-${now}.log`
    )

  const mockMessageName = 'mock-' + moduleId
  const logMessageName = 'log-mocks-' + moduleId
  const mocked: MockedModule<M> = { ...actualModule }
  const logged = {} as { [K in keyof M]: ReturnType<M[K]>[] }
  const returnValues = {} as { [K in keyof M]: ReturnType<M[K]>[] }

  const writeLog = () =>
    promises.writeFile(logFilePath(), JSON.stringify(logged, null, 2))

  for (const functionName in actualModule) {
    logged[functionName] = []

    returnValues[functionName] = []

    // @ts-ignore
    mocked[functionName] = (...args) => {
      const mockedReturnValue = returnValues[functionName].shift()
      if (mockedReturnValue) {
        logged[functionName].push(mockedReturnValue)
        return mockedReturnValue
      }

      const actualReturnValue = actualModule[functionName](...args)

      console.log(`${functionName} was not mocked`, {
        args,
        returnValue: actualReturnValue,
      })

      logged[functionName].push(actualReturnValue)

      writeLog()

      return actualReturnValue
    }
  }

  function resetMocks() {
    for (const k in returnValues) returnValues[k] = []
  }

  window.document.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('start-test', (e, testId) => {
      currentTestId = testId
    })
    ipcRenderer.on('end-test', () => {
      currentTestId = ''
    })

    ipcRenderer.on(mockMessageName, (event, functionName, newReturnValue) => {
      console.log(
        `Function ${functionName} mocked with: ${JSON.stringify(
          newReturnValue
        )}`
      )
      returnValues[functionName].push(deserializeReturnValue(newReturnValue))
      if (process.env.INTEGRATION_DEV)
        sendToMainProcess({
          type: 'log',
          args: [
            `\n\n\nFunction ${functionName} mocked with: ${JSON.stringify(
              newReturnValue
            )}\n\n\n`,
          ],
        })
    })

    ipcRenderer.on('reset-mocks', () => {
      resetMocks()
    })

    ipcRenderer.on(logMessageName, () => {
      writeLog()
    })
  })

  async function mockFunction<F extends keyof M>(
    app: TestDriver,
    functionName: F,
    returnValue: ReturnType<M[F]>
  ) {
    return await app.webContentsSend(
      mockMessageName,
      functionName,
      await serializeReturnValue(returnValue)
    )
  }

  async function mockFunctions(
    app: TestDriver,
    mocks: Partial<{ [K in keyof M]: ReturnType<M[K]>[] }>
  ) {
    if (!(await app.isReady).result)
      throw new Error(
        `Can't mock functions because test driver failed to start.`
      )

    for (const entry of Object.entries(mocks)) {
      const functionName: keyof M = entry[0] as any
      const returnValues: ReturnType<M[typeof functionName]>[] = entry[1] as any

      for (const returnValue of returnValues)
        await mockFunction(app, functionName, returnValue)
    }
  }

  async function logMocks(app: TestDriver) {
    await app.webContentsSend(logMessageName)
    await null
  }

  return { module: mocked, resetMocks, mockFunctions, logMocks }
}

const serializeReturnValue = async (returnValue: any) =>
  returnValue instanceof Promise
    ? {
        isPromise: true,
        value: await returnValue,
      }
    : { isPromise: false, value: returnValue }

const deserializeReturnValue = ({
  isPromise,
  value,
}: {
  isPromise: boolean
  value: any
}) => (isPromise ? Promise.resolve(value) : value)
